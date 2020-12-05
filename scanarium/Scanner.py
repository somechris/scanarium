import locale
import os
import re
import sys
import time

import cv2
import numpy as np
from pyzbar import pyzbar

from .ScanariumError import ScanariumError


def debug_show_image(title, image, config):
    if config.get('general', 'debug', 'boolean') and \
            not config.get('general', 'hide_images_in_debug', 'boolean'):
        cv2.imshow(title, image)
        locale.resetlocale()
        cv2.waitKey(0)
        cv2.destroyAllWindows()


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

    scanarium.debug_show_image('scaled', scaled_image)

    return (scaled_image, scale_factor)


def find_rect_points(image, decreasingArea=True, required_points=[]):
    imageArea = image.shape[0] * image.shape[1]
    contour_min_area = imageArea / 25

    cannied = cv2.Canny(image, 30, 400)
    # When looking for contours that contain some QR code, RETR_LIST (below)
    # might not be most efficient, RETR_TREE might allow to optimize. But
    # RETR_LIST is simpler to use and quick enough for now.
    # todo: See if RETR_TREE performs better here.
    contours, _ = cv2.findContours(cannied, cv2.RETR_LIST,
                                   cv2.CHAIN_APPROX_NONE)

    approx = None
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
                # A required point is outside, so we skip this contour
                continue

            # The contour is big enough, looks like a rect, and contains all
            # required points. That's the contour to continue with.
            break
        else:
            approx = None

    if approx is None:
        raise ScanariumError('SE_SCAN_NO_APPROX',
                             'Failed to find rectangle contour')
    return approx


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


def rectify(scanarium, image, decreasingArea=True, required_points=[]):
    # If the picture is too big (E.g.: from a proper photo camera), edge
    # detection won't work reliably, as the sheet's contour will exhibit too
    # much detail and would get broken down into more than 4 segments. So we
    # scale too big images down. Note though that the scaled image is only
    # used for edge detection. Rectification happens on the original picture.
    (scaled_image, scale_factor) = scale_image(scanarium, image)
    scaled_points = [(int(point[0] * scale_factor),
                      int(point[1] * scale_factor)
                      ) for point in required_points]
    found_points_scaled = find_rect_points(scaled_image, decreasingArea,
                                           scaled_points)
    found_points = (found_points_scaled / scale_factor).astype('float32')

    grey_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    if scanarium.get_config('scan', 'sub_pixel_corners', 'boolean'):
        search_window = (5, 5)
        rectify_points = cv2.cornerSubPix(
            grey_image, found_points, search_window, (-1, -1),
            (cv2.TERM_CRITERIA_EPS + cv2.TermCriteria_COUNT, 20, 0.03))
    else:
        rectify_points = found_points

    # Now rectifying using the original (!) image.
    image = rectify_by_rect_points(image, rectify_points.reshape(4, 2))
    return image


def rectify_to_qr_parent_rect(scanarium, image, qr_rect):
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
                   required_points=required_points)


def rectify_to_biggest_rect(scanarium, image):
    return rectify(scanarium, image, decreasingArea=True)


def extract_qr(image):
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


def mask(scanarium, image, scene, actor):
    masked_file_path = os.path.join(scanarium.get_scenes_dir_abs(), scene,
                                    'actors', actor, '%s-mask.png' % actor)
    if not os.path.isfile(masked_file_path):
        raise ScanariumError('SE_SCAN_NO_MASK',
                             'Failed to find mask {file_name}',
                             {'file_name': masked_file_path})

    mask = cv2.imread(masked_file_path, 0)
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]), cv2.INTER_AREA)

    (b, g, r) = cv2.split(image)
    masked = cv2.merge((b, g, r, mask))
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


def process_actor_image_with_qr_code(scanarium, image, qr_rect, scene, actor):
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
    image = mask(scanarium, image, scene, actor)
    image = crop(image)
    image = balance(scanarium, image)

    # Finally the image is rectified, landscape, and the QR code is in the
    # lower left-hand corner, and white-balance has been run.

    scanarium.debug_show_image('final', image)
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
    elif command == 'switchScene':
        scene_dir = os.path.join(scanarium.get_scenes_dir_abs(), parameter)
        if os.path.isdir(scene_dir):
            ret = {}
        else:
            raise ScanariumError('SE_UNKNOWN_SCENE',
                                 'Scene "{scene_name}" does not exist',
                                 {'scene_name': parameter})
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
    ret = 'STATIC-IMAGE-CAMERA'

    file_path = config.get('scan', 'source')
    if file_path.startswith('cam:'):
        ret = 'PROPER-CAMERA'

    return ret


def open_camera(config):
    camera = None
    camera_type = get_camera_type(config)
    if camera_type == 'PROPER-CAMERA':
        file_path = config.get('scan', 'source')
        cam_nr_str = file_path[4:]
        try:
            cam_nr = int(cam_nr_str)
        except ValueError:
            raise ScanariumError('SE_VALUE', 'Failed to parse "{cam_nr}" of '
                                 'source "{file_name}" to number',
                                 {'cam_nr': cam_nr_str,
                                  'file_name': file_path})
        camera = cv2.VideoCapture(cam_nr)

        if not camera.isOpened():
            raise ScanariumError('SE_CAP_NOT_OPEN',
                                 'Failed to open camera {cam_nr}',
                                 {'cam_nr': cam_nr_str})

        # To avoid having to use external programs for basic camera setup, we
        # set the most basic properties right within Scanarium
        set_camera_property(config, camera, cv2.CAP_PROP_FRAME_WIDTH, 'width')
        set_camera_property(config, camera, cv2.CAP_PROP_FRAME_HEIGHT,
                            'height')

        delay = config.get('scan', 'delay', allow_empty=True, kind='float')
        if delay:
            camera.read()
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


def get_raw_image(config, camera=None):
    manage_camera = camera is None
    if manage_camera:
        camera = open_camera(config)

    camera_type = get_camera_type(config)
    if camera_type == 'PROPER-CAMERA':
        _, image = camera.read()
    elif camera_type == 'STATIC-IMAGE-CAMERA':
        file_path = config.get('scan', 'source')
        image = cv2.imread(file_path)
    else:
        raise ScanariumError('SE_CAM_TYPE_UNKNOWN',
                             'Unknown camera type "{camera_type}"',
                             {'camera_type': camera_type})

    if manage_camera:
        close_camera(config, camera)

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

        width, height = image.shape[:2]
        new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(
            cam_matrix, dist_coeffs, (width, height), 1)

        debug_show_image('raw before undistorting', image, config)
        ret = cv2.undistort(ret, cam_matrix, dist_coeffs, None,
                            new_camera_matrix)
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

    def extract_qr(self, image):
        return extract_qr(image)

    def process_image_with_qr_code(self, scanarium, image, qr_rect, data,
                                   should_skip_exception=None):
        return process_image_with_qr_code(
            scanarium, self._command_logger, image, qr_rect, data,
            should_skip_exception)

    def rectify_to_biggest_rect(self, scanarium, image):
        return rectify_to_biggest_rect(scanarium, image)
