import locale
import os
import re
import sys
import time
import random

import cv2
import numpy as np
from pyzbar import pyzbar

from .ScanariumError import ScanariumError


NEXT_RAW_IMAGE_STORE = 0  # Timestamp of when to store the next raw image.


def debug_show_image(title, image, config):
    if config.get('general', 'debug', 'boolean') and \
            not config.get('general', 'hide_images_in_debug', 'boolean'):
        cv2.imshow(title, image)
        locale.resetlocale()


def scale_image(scanarium, image):
    scaled_height = 1000
    if image.shape[0] > scaled_height * 1.3:
        scale_factor = scaled_height / image.shape[0]
        scaled_width = int(image.shape[1] * scale_factor)
        scaled_dimension = (scaled_width, scaled_height)
        scaled_image = cv2.resize(image, scaled_dimension, cv2.INTER_AREA)
    else:
        scaled_image = image
        scale_factor = 1

    scanarium.debug_show_image('Scaled image', scaled_image)

    return (scaled_image, scale_factor)


def add_text(image, text, x=2, y=5, color=None):
    font = cv2.FONT_HERSHEY_SIMPLEX
    fontScale = image.shape[0] / 1000

    position = (int(image.shape[1] * x / 100),
                int(image.shape[0] * y / 100))

    if color is None:
        color = (0, 255, 0)

    return cv2.putText(image, text, position, font, fontScale, color)


def debug_show_contours(scanarium, image, contours, hierarchy):
    if scanarium.get_config('general', 'debug', 'boolean'):
        # The contours image should contain the dampened image and allow color
        contours_image = cv2.cvtColor((image * 0.3).astype('uint8'),
                                      cv2.COLOR_GRAY2BGR)
        for i in range(len(contours)):
            color = (random.randint(0, 256), random.randint(0, 256),
                     random.randint(0, 256))
            cv2.drawContours(contours_image, contours, i, color, 2,
                             cv2.LINE_8, hierarchy, 0)
        add_text(contours_image, f'Found contours: {len(contours)}')
        scanarium.debug_show_image('Contours', contours_image)


def find_rect_points(scanarium, image, decreasingArea=True,
                     required_points=[]):
    imageArea = image.shape[0] * image.shape[1]
    contour_min_area = imageArea / 25
    prepared_image = image

    canny_blur_size = scanarium.get_config('scan', 'canny_blur_size',
                                           kind='int')
    canny_threshold_1 = scanarium.get_config('scan', 'canny_threshold_1',
                                             kind='int')
    canny_threshold_2 = scanarium.get_config('scan', 'canny_threshold_2',
                                             kind='int')
    if canny_blur_size > 1:
        prepared_image = cv2.blur(
            prepared_image, (canny_blur_size, canny_blur_size))
    edges_image = cv2.Canny(prepared_image, canny_threshold_1,
                            canny_threshold_2)
    # When looking for contours that contain some QR code, RETR_LIST (below)
    # might not be most efficient, RETR_TREE might allow to optimize. But
    # RETR_LIST is simpler to use and quick enough for now.
    # todo: See if RETR_TREE performs better here.
    contours, hierarchy = cv2.findContours(edges_image, cv2.RETR_LIST,
                                           cv2.CHAIN_APPROX_NONE)
    debug_show_contours(scanarium, image, contours, hierarchy)

    good_approx = None
    for contour in sorted(contours, key=cv2.contourArea,
                          reverse=decreasingArea):
        if cv2.contourArea(contour) < contour_min_area:
            # Contour too small, so we skip this contour
            continue

        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        if len(approx) == 4:
            # 4 points ... that looks should be turned into a rectangle

            if any(cv2.pointPolygonTest(approx, point, False) < 0
                   for point in required_points):
                # A required point is outside, so we skip this contour.
                continue

            # The contour is big enough, looks like a rect, and contains all
            # required points. That's the contour to continue with.
            good_approx = approx
            break

    if good_approx is None:
        raise ScanariumError('SE_SCAN_NO_APPROX',
                             'Failed to find rectangle contour')
    return good_approx


def distance(pointA, pointB):
    return np.linalg.norm([pointA - pointB])


def rectify_by_rect_points(image, points):
    # The following heuristics of classifying the 4 points is based on the
    # assumption that the rectangle is not distorted too much. So if the
    # camera angle is skew, it will fail.
    s = points.sum(axis=1)
    s_tl = points[np.argmin(s)]  # smallest sum, is top left
    s_br = points[np.argmax(s)]  # biggest sum, is bottom right

    d = np.diff(points, axis=1)
    s_tr = points[np.argmin(d)]  # smallest difference, is top right
    s_bl = points[np.argmax(d)]  # biggest difference, is bottom left

    source = np.array([s_tl, s_tr, s_br, s_bl], dtype="float32")

    d_w = int(max(distance(s_br, s_bl), distance(s_tr, s_tl))) - 1
    d_h = int(max(distance(s_tr, s_br), distance(s_tl, s_bl))) - 1

    dest = np.array([[0, 0], [d_w, 0], [d_w, d_h], [0, d_h]], dtype="float32")

    M = cv2.getPerspectiveTransform(source, dest)
    return cv2.warpPerspective(image, M, (d_w, d_h))


def get_brightness_factor(scanarium):
    factor = None
    file_name = scanarium.get_config('scan', 'max_brightness',
                                     allow_empty=True)
    if file_name is not None:
        image = cv2.imread(file_name)

        brightness = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # For each pixel, brightness is a value from 0 to 255.
        # For each pixel `c` from the camera and corresponding brightness `b`
        # from the `max_brightness` image, we want to compute the effective
        # brightness `e` as
        #
        #     e = c / b * 255
        #
        # (with clipping to [0, 255] afterwards). To avoid repetitive
        # costly computations for each frame, we do not return `b` as is, but
        # we rewrite the equation as
        #
        #       e = c * f, where f = 255 / b
        #
        # (of course again with clipping to [0, 255] afterwards). In this
        # second formulation, we can compute the factor `f` ahead of time,
        # which is what this function does. This approach is better than the
        # first equation as now only a single multiplication is needed for each
        # pixel instead of a multiplication and division. This re-formulation
        # shaves off about 2/3 of computation time per frame.
        #
        # (We clip pixel with maximum brightness of 0 to 1 to avoid division by
        # zero errors. But pixels of maximum brightness 0 do not contribute
        # anyways, so this simplification does not adversely affect the result,
        # while it considerably simplifies computation.)
        factor = 255 / np.clip(brightness, 1, 255)

    return factor


def correct_image_brightness(scanarium, image):
    factor = scanarium.get_brightness_factor()
    if factor is not None:
        # This pipeline normalizes each pixel with respect to the maximal
        # brightness allowed in the max image.
        image = np.clip(image * factor, 0, 255).astype(np.uint8)

    return image


def prepare_image(scanarium, image):
    # If the picture is too big (E.g.: from a proper photo camera), edge
    # detection won't work reliably, as the sheet's contour will exhibit too
    # much detail and would get broken down into more than 4 segments. So we
    # scale too big images down. Note though that the scaled image is only
    # used for edge detection. Rectification happens on the original picture.
    (prepared_image, scale_factor) = scale_image(scanarium, image)

    prepared_image = cv2.cvtColor(prepared_image, cv2.COLOR_BGR2GRAY)
    prepared_image = correct_image_brightness(scanarium, prepared_image)

    scanarium.debug_show_image('Prepared for detection', prepared_image)

    return (prepared_image, scale_factor)


def refine_corners(scanarium, prepared_image, points):
    window_size = scanarium.get_config('scan', 'corner_refinement_size', 'int')
    if window_size > 1:
        search_window = (window_size, window_size)

        iteration_bound = scanarium.get_config(
            'scan', 'corner_refinement_iteration_bound', 'int')
        accuracy = scanarium.get_config(
            'scan', 'corner_refinement_accuracy', 'float')
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_COUNT,
                    iteration_bound, accuracy)

        points = cv2.cornerSubPix(
            prepared_image, points, search_window, (-1, -1), criteria)

    return points.reshape(4, 2)


def rectify(scanarium, image, decreasingArea=True, required_points=[],
            yield_only_points=False):
    (prepared_image, scale_factor) = prepare_image(scanarium, image)

    scaled_points = [(int(point[0] * scale_factor),
                      int(point[1] * scale_factor)
                      ) for point in required_points]
    found_points_scaled = find_rect_points(scanarium, prepared_image,
                                           decreasingArea, scaled_points)
    found_points = (found_points_scaled / scale_factor).astype('float32')

    rectify_points = refine_corners(scanarium, prepared_image, found_points)

    if yield_only_points:
        ret = rectify_points
    else:
        # Now rectifying using the original (!) image.
        ret = rectify_by_rect_points(image, rectify_points)
    return ret


def rectify_to_qr_parent_rect(scanarium, image, qr_rect,
                              yield_only_points=False):
    def qr_rect_point(x_factor, y_factor):
        return (qr_rect.left + x_factor * qr_rect.width,
                qr_rect.top + y_factor * qr_rect.height)

    inset_factor = 0.2
    top_left_inset = qr_rect_point(inset_factor, inset_factor)
    top_right_inset = qr_rect_point(1. - inset_factor, inset_factor)
    bottom_left_inset = qr_rect_point(inset_factor, 1. - inset_factor)
    bottom_right_inset = qr_rect_point(1. - inset_factor, 1. - inset_factor)

    required_points = [
        top_left_inset,
        top_right_inset,
        bottom_left_inset,
        bottom_right_inset,
    ]

    return rectify(scanarium, image, decreasingArea=False,
                   required_points=required_points,
                   yield_only_points=yield_only_points)


def rectify_to_biggest_rect(scanarium, image, yield_only_points=False):
    return rectify(scanarium, image, decreasingArea=True,
                   yield_only_points=yield_only_points)


def extract_qr(image):
    # With low light images, the random noise in different color channels is
    # typically in the way of robust detection. So we convert to
    # grey to smoothen out the noise a bit.
    image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    codes = pyzbar.decode(image)
    if len(codes) != 1:
        raise ScanariumError('SE_SCAN_NO_QR_CODE',
                             'Failed to find scanned QR code')
    code = codes[0]

    rect = code.rect
    data_raw = code.data.decode('utf-8')
    data = re.sub('[^0-9a-zA-Z:_]+', '_', data_raw)
    return (rect, data)


def orient_image(image):
    if image.shape[0] > image.shape[1]:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    (qr_rect, _) = extract_qr(image)
    if qr_rect.left + qr_rect.width / 2 > image.shape[1] / 2:
        # QR Code is not on the left half of the picture. As it's landscape
        # (see above), the qr code is in the top-right corner and we need to
        # rotate 180 degrees.
        image = cv2.rotate(image, cv2.ROTATE_180)

    return image


def mask(scanarium, image, scene, actor, visualized_alpha=None):
    masked_file_path = os.path.join(scanarium.get_scenes_dir_abs(), scene,
                                    'actors', actor, '%s-mask.png' % actor)
    if not os.path.isfile(masked_file_path):
        raise ScanariumError('SE_SCAN_NO_MASK',
                             'Failed to find mask {file_name}',
                             {'file_name': masked_file_path})

    mask = cv2.imread(masked_file_path, 0)
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]), cv2.INTER_AREA)

    channels = cv2.split(image)
    if visualized_alpha is not None:
        factor = np.clip(mask.astype(np.float32) / 255, visualized_alpha, 1)
        channels = [(channel * factor).astype(np.uint8)
                    for channel in channels]

    channels.append(mask)
    masked = cv2.merge(channels)
    return masked


def crop(image):
    y, x = image[:, :, 3].nonzero()
    x_min = np.min(x)
    x_max = np.max(x)
    y_min = np.min(y)
    y_max = np.max(y)

    cropped = image[y_min:y_max, x_min:x_max]

    return cropped


def balance(scanarium, image):
    algo = scanarium.get_config('scan', 'white_balance').lower()
    if algo in ['simple', 'yes', 'true']:
        wb = cv2.xphoto.createSimpleWB()
        ret = wb.balanceWhite(image)
    elif algo == 'grayworld':
        wb = cv2.xphoto.createGrayworldWB()
        wb.setSaturationThreshold(0.95)
        ret = wb.balanceWhite(image)
    elif algo in ['none', 'no', 'false']:
        ret = image
    else:
        raise ScanariumError('SE_SCAN_UNKNOWN_WB',
                             'Unknown white balance filter configured')

    return ret


def save_image(scanarium, image, scene, actor):
    timestamp = str(int(time.time()))
    actor_path = os.path.join(scene, 'actors', actor)
    if not os.path.isdir(os.path.join(scanarium.get_scenes_dir_abs(),
                                      actor_path)):
        # This should never happen, as masking already ensured that the actor
        # source is there. But since we're about to create directories, we're
        # extra warry.
        raise ScanariumError('SE_SCAN_SAVE_PATH_MISSING', 'Directory to '
                             'store file in does not exist, or is no '
                             'directory')

    dynamic_dir = scanarium.get_dynamic_directory()
    image_dir = os.path.join(dynamic_dir, 'scenes', actor_path)
    os.makedirs(image_dir, exist_ok=True)
    image_file = os.path.join(image_dir, '%s.png' % timestamp)
    cv2.imwrite(image_file, image)

    return timestamp


def actor_image_pipeline(scanarium, image, qr_rect, scene, actor,
                         visualized_alpha=None):
    scene_dir = os.path.join(scanarium.get_scenes_dir_abs(), scene)
    if not os.path.isdir(scene_dir):
        raise ScanariumError('SE_UNKNOWN_SCENE',
                             'Scene "{scene_name}" does not exist',
                             {'scene_name': scene})

    actor_dir = os.path.join(scene_dir, 'actors', actor)
    if not os.path.isdir(actor_dir):
        raise ScanariumError(
            'SE_UNKNOWN_ACTOR',
            'Actor "{actor_name}" does not exist in scene "{scene_name}"',
            {'scene_name': scene, 'actor_name': actor})

    image = rectify_to_qr_parent_rect(scanarium, image, qr_rect)
    image = orient_image(image)
    image = mask(scanarium, image, scene, actor,
                 visualized_alpha=visualized_alpha)
    image = crop(image)
    image = balance(scanarium, image)

    # Finally the image is rectified, landscape, and the QR code is in the
    # lower left-hand corner, and white-balance has been run.

    scanarium.debug_show_image('Final', image)
    return image


def process_actor_image_with_qr_code(scanarium, image, qr_rect, scene, actor):
    image = actor_image_pipeline(scanarium, image, qr_rect, scene, actor)
    flavor = save_image(scanarium, image, scene, actor)

    scanarium.reindex_actors_for_scene(scene)

    return {
        'scene': scene,
        'actor': actor,
        'flavor': flavor,
    }


def process_image_with_qr_code_unlogged(scanarium, command, parameter, image,
                                        qr_rect):
    if command == 'debug':
        if parameter == 'ok':
            ret = {
                'ok': True
            }
        elif parameter == 'fail':
            raise ScanariumError(
                'SE_DEBUG_FAIL',
                'Intentional error from the "debug:fail" command')
        else:
            raise ScanariumError(
                'SE_UNKNOWN_PARAM',
                'Command "{command}" does not allow a parameter "{parameter}"',
                {'command': command, 'parameter': parameter})
    elif command == 'reset':
        ret = scanarium.reset_dynamic_content(log=False)
    elif command == 'switchScene':
        scene_dir = os.path.join(scanarium.get_scenes_dir_abs(), parameter)
        if os.path.isdir(scene_dir):
            ret = {}
        else:
            raise ScanariumError('SE_UNKNOWN_SCENE',
                                 'Scene "{scene_name}" does not exist',
                                 {'scene_name': parameter})
    elif command == 'system':
        if parameter == 'poweroff':
            command = ['/usr/bin/sudo', '--non-interactive', '/sbin/poweroff']
            scanarium.run(command, timeout=10)
            ret = {
                'ok': True
            }
        else:
            raise ScanariumError(
                'SE_UNKNOWN_PARAM',
                'Command "{command}" does not allow a parameter "{parameter}"',
                {'command': command, 'parameter': parameter})
    else:
        ret = process_actor_image_with_qr_code(scanarium, image, qr_rect,
                                               command, parameter)
    return ret


def process_image_with_qr_code(scanarium, command_logger, image, qr_rect, data,
                               should_skip_exception=None):
    command = None
    parameter = None

    payload = {}
    exc_info = None
    try:
        (command, parameter) = data.split(':', 1)
        payload = process_image_with_qr_code_unlogged(
            scanarium, command, parameter, image, qr_rect)
    except Exception as e:
        if should_skip_exception is not None and should_skip_exception(e):
            raise ScanariumError('SE_SKIPPED_EXCEPTION',
                                 'Exception marked as skipped')
        exc_info = sys.exc_info()

    return command_logger.log(payload, exc_info, command, [parameter])


def set_camera_property(config, cap, property, config_key):
    value = config.get('scan', config_key, allow_empty=True, kind='int')
    if value is not None:
        cap.set(property, value)


def get_camera_type(config):
    ret = 'PROPER-CAMERA'

    file_path = config.get('scan', 'source')
    if file_path.startswith('image:'):
        ret = 'STATIC-IMAGE-CAMERA'

    return ret


def open_camera(config):
    camera = None
    camera_type = get_camera_type(config)
    if camera_type == 'PROPER-CAMERA':
        source = config.get('scan', 'source')
        if source.startswith('cam:'):
            stripped = source[4:]
            try:
                source = int(stripped)
            except ValueError:
                raise ScanariumError('SE_VALUE', 'Failed to parse "{stripped}"'
                                     ' of source "{source}" to number',
                                     {'stripped': stripped,
                                      'source': source})
        camera = cv2.VideoCapture(source)

        if not camera.isOpened():
            raise ScanariumError('SE_CAP_NOT_OPEN',
                                 'Failed to open camera "{source}"',
                                 {'source': source})

        # To avoid having to use external programs for basic camera setup, we
        # set the most basic properties right within Scanarium
        set_camera_property(config, camera, cv2.CAP_PROP_FRAME_WIDTH, 'width')
        set_camera_property(config, camera, cv2.CAP_PROP_FRAME_HEIGHT,
                            'height')

        # Since we do not necessarily need all images, but much rather want to
        # arrive at the most recent image quickly, we keep buffers as small as
        # we can, so we need to skip over as few buffered images as possible.
        # But as minimizing buffers makes some image pipelines re-initialize
        # themselves, which might throw cameras off, we only minimize buffers
        # if the configuration allows it.
        if config.get('scan', 'minimize_buffers', 'boolean'):
            camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            camera.set(cv2.CAP_PROP_GSTREAMER_QUEUE_LENGTH, 1)

        delay = config.get('scan', 'delay', allow_empty=True, kind='float')
        if delay:
            camera.grab()
            time.sleep(delay)
    elif camera_type == 'STATIC-IMAGE-CAMERA':
        camera = camera_type
    else:
        raise ScanariumError('SE_CAM_TYPE_UNKNOWN',
                             'Unknown camera type "{camera_type}"',
                             {'camera_type': camera_type})

    return camera


def close_camera(config, camera):
    camera_type = get_camera_type(config)
    if camera_type == 'PROPER-CAMERA':
        camera.release()
    elif camera_type == 'STATIC-IMAGE-CAMERA':
        # Camera is static image, nothing to do
        pass
    else:
        raise ScanariumError('SE_CAM_TYPE_UNKNOWN',
                             'Unknown camera type "{camera_type}"',
                             {'camera_type': camera_type})


def store_raw_image(config, image):
    global NEXT_RAW_IMAGE_STORE
    dir_path = config.get('scan', 'raw_image_directory', allow_empty=True)
    if dir_path is not None:
        now = time.time()
        if now >= NEXT_RAW_IMAGE_STORE:
            file_path = os.path.join(dir_path, '%f.png' % (now))
            os.makedirs(dir_path, exist_ok=True)
            cv2.imwrite(file_path, image)
            config.get('scan', 'raw_image_period')
            NEXT_RAW_IMAGE_STORE = now + config.get(
                'scan', 'raw_image_period', 'float')


def get_raw_image(config, camera=None):
    manage_camera = camera is None
    if manage_camera:
        camera = open_camera(config)

    camera_type = get_camera_type(config)
    if camera_type == 'PROPER-CAMERA':
        success = True
        duration = -1
        min_duration = config.get('scan', 'minimum_grab_time', kind='float')
        while success and duration < min_duration:
            start = time.time()
            success = camera.grab()
            duration = time.time() - start

        if success:
            # Grabbing worked and duration is ok, so we try to retrieve
            success, image = camera.retrieve()

        if not success:
            # Either grabbing or retrieving failed. So we give up.
            raise ScanariumError('SE_SCAN_NO_RAW_IMAGE',
                                 'Failed to retrieve image from camera')

    elif camera_type == 'STATIC-IMAGE-CAMERA':
        file_path = config.get('scan', 'source')
        image = cv2.imread(file_path)
    else:
        raise ScanariumError('SE_CAM_TYPE_UNKNOWN',
                             'Unknown camera type "{camera_type}"',
                             {'camera_type': camera_type})

    if manage_camera:
        close_camera(config, camera)

    store_raw_image(config, image)
    debug_show_image('Raw image', image, config)

    return image


def undistort_image(image, config):
    ret = image
    param_file = config.get('scan', 'calibration_xml_file')
    if param_file:
        try:
            storage = cv2.FileStorage(param_file, cv2.FileStorage_READ)
            cam_matrix = storage.getNode('cameraMatrix').mat()
            dist_coeffs = storage.getNode('dist_coeffs').mat()
        except Exception:
            raise ScanariumError(
                'SE_LOAD_UNDISTORT',
                'Failed to load parameters for undistortion from '
                '\"{file_name}\"',
                {'file_name': param_file})

        height, width = image.shape[:2]
        new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(
            cam_matrix, dist_coeffs, (width, height), 1)

        ret = cv2.undistort(ret, cam_matrix, dist_coeffs, None,
                            new_camera_matrix)
        debug_show_image('Undistorted image', ret, config)
    return ret


class Scanner(object):
    def __init__(self, config, command_logger):
        super(Scanner, self).__init__()
        self._config = config
        self._command_logger = command_logger

    def debug_show_image(self, title, image):
        debug_show_image(title, image, self._config)

    def open_camera(self):
        return open_camera(self._config)

    def close_camera(self, camera):
        return close_camera(self._config, camera)

    def get_image(self, camera=None):
        raw = get_raw_image(self._config, camera)
        return undistort_image(raw, self._config)

    def get_brightness_factor(self, scanarium):
        return get_brightness_factor(scanarium)

    def extract_qr(self, image):
        return extract_qr(image)

    def process_image_with_qr_code(self, scanarium, image, qr_rect, data,
                                   should_skip_exception=None):
        return process_image_with_qr_code(
            scanarium, self._command_logger, image, qr_rect, data,
            should_skip_exception)

    def actor_image_pipeline(self, scanarium, image, qr_rect, scene, actor,
                             visualized_alpha=None):
        return actor_image_pipeline(
            scanarium, image, qr_rect, scene, actor,
            visualized_alpha=visualized_alpha)

    def rectify_to_biggest_rect(self, scanarium, image,
                                yield_only_points=False):
        return rectify_to_biggest_rect(scanarium, image,
                                       yield_only_points=yield_only_points)

    def rectify_to_qr_parent_rect(self, scanarium, image, qr_rect,
                                  yield_only_points=False):
        return rectify_to_qr_parent_rect(scanarium, image, qr_rect,
                                         yield_only_points=yield_only_points)
