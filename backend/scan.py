#!/usr/bin/env python3

import logging
import os
import re
import time
import sys
import locale

import cv2
import numpy as np
from pyzbar import pyzbar
import xml.etree.ElementTree as ET

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import Scanarium
from common import ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


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

    if approx is None:
        raise ScanariumError('SE_SCAN_NO_APPROX',
                             'Failed to find rectangle contour')

    points = approx.reshape(4, 2)
    return points


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
    rect_points = find_rect_points(scaled_image, decreasingArea, scaled_points)

    # todo: Check if subpixel corner detection improves the overall result

    # Now rectifying using the original (!) image.
    image = rectify_by_rect_points(image, rect_points / scale_factor)
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


def scale_to_paper_size(scanarium, image):
    paper_width = scanarium.get_config('scan', 'paper_width', 'int')
    paper_height = scanarium.get_config('scan', 'paper_height', 'int')

    height = image.shape[0]

    width = int(height * paper_width / paper_height)
    dimension = (width, height)
    return cv2.resize(image, dimension, cv2.INTER_AREA)


def extract_qr(image):
    codes = pyzbar.decode(image)
    if len(codes) != 1:
        raise ScanariumError('SE_SCAN_NO_QR_CODE',
                             'Failed to find scanned QR code')
    code = codes[0]

    rect = code.rect
    data_raw = code.data.decode('utf-8')
    data = re.sub('[^0-9a-zA-Z:_]+', '_', data_raw)
    (scene, actor) = data.split(':', 1)
    return (rect, scene, actor)


def orient_image(image):
    if image.shape[0] > image.shape[1]:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    (qr_rect, _, _) = extract_qr(image)
    if qr_rect.left + qr_rect.width / 2 > image.shape[1] / 2:
        # QR Code is not on the left half of the picture. As it's landscape
        # (see above), the qr code is in the top-right corner and we need to
        # rotate 180 degrees.
        image = cv2.rotate(image, cv2.ROTATE_180)

    return image


def get_svg_document_to_user_dpi_factors(scanarium, tree):
    root = tree.getroot()

    def to_inch(name, default):
        raw = root.attrib.get(name, default)
        ret = 0
        if raw.endswith('mm'):
            ret = float(raw[:-2]) / 25.4
        elif raw.endswitch('in'):
            ret = float(raw[:-2])
        else:
            ret = float(raw)
        return ret

    paper_width = scanarium.get_config('scan', 'paper_width', 'int')
    paper_height = scanarium.get_config('scan', 'paper_height', 'int')
    width = to_inch('width', '%dmm' % (paper_width))
    height = to_inch('height', '%dmm' % (paper_height))
    view_box = root.attrib.get('viewBox',
                               '0 0 %d %d' % (paper_width, paper_height)
                               ).split(' ')
    view_box_width = float(view_box[2]) - float(view_box[0])
    view_box_height = float(view_box[3]) - float(view_box[1])
    document_dpi_x = view_box_width / width
    document_dpi_y = view_box_height / height
    inkscape_dpi = scanarium.get_config('programs', 'inkscape_dpi', 'int')
    document_to_user_factor_x = inkscape_dpi / document_dpi_x
    document_to_user_factor_y = inkscape_dpi / document_dpi_y

    return (document_to_user_factor_x, document_to_user_factor_y)


def get_svg_contour_rect_stroke_width(tree):
    stroke_width = 0
    try:
        path = './/{http://www.w3.org/2000/svg}rect[@id="contour"]'
        contour = tree.find(path)
        for setting in contour.attrib.get('style', '').split(';'):
            k_raw, v_raw = setting.split(':', 1)
            if k_raw.strip() == 'stroke-width':
                stroke_width = float(v_raw.strip())
    except Exception:
        logging.exception('Failed to parse "stroke-width"')

    return stroke_width


def get_svg_contour_rect_area(scanarium, svg_path):
    # We want to determine the white inner area of the rect with id
    # `contour` in user coordinates. Ideally, Inkscape would allow to access
    # that directly. However, its `--query*` arguments only allow to get the
    # rect's outer dimensions. But we need the rect's inner dimensions
    # (without border). So we have to compute that manually.
    # This is a 5 step process:
    # 1. Determine the factor from document units to user units
    # 2. Extract the stroke width from the document
    # 3. Scale it accordingly
    # 4. Determine contour rect position and dimension
    # 5. Compute contour's inner rect

    # 1. Determine the factor from document units to user units
    tree = ET.parse(svg_path)
    document_to_user_factor_x, document_to_user_factor_y = \
        get_svg_document_to_user_dpi_factors(scanarium, tree)

    # 2. Extract the stroke width from the document
    stroke_width = get_svg_contour_rect_stroke_width(tree)

    # 3. Scale it accordingly
    user_stroke_width_x = stroke_width * document_to_user_factor_x
    user_stroke_width_y = stroke_width * document_to_user_factor_y

    # 4. Determine contour rect position and dimension
    inkscape_dpi = scanarium.get_config('programs', 'inkscape_dpi', 'float')
    paper_width = scanarium.get_config('scan', 'paper_width', 'int')
    paper_height = scanarium.get_config('scan', 'paper_height', 'int')

    x = 0
    y = 0
    width = inkscape_dpi / 25.4 * paper_width
    height = inkscape_dpi / 25.4 * paper_height

    command = [
        scanarium.get_config('programs', 'inkscape'),
        '--query-all',
        svg_path,
    ]
    element_sizes = scanarium.run(command).split('\n')
    for element_size in element_sizes:
        if element_size.startswith('contour,'):
            x, y, width, height = map(float, element_size.split(',')[1:])

    # 5. Compute contour's inner rect
    # Since we want Python 3.6 compatibility, we cannot use %n and need to
    # resort to locale.format_string with %f.
    return locale.format_string('%f:%f:%f:%f', (
        (x + user_stroke_width_x),
        (y + user_stroke_width_y),
        (x + width - user_stroke_width_x),
        (y + height - user_stroke_width_y),
    ))


def generate_mask(scanarium, mask_path):
    source_path = mask_path[:-9] + '.svg'

    if not os.path.isfile(source_path):
        raise ScanariumError('SE_SCAN_NO_SOURCE_FOR_MASK',
                             'Failed to find source file for generating mask')

    if not os.path.isfile(mask_path) \
            or os.stat(source_path).st_mtime > os.stat(mask_path).st_mtime:
        contour_area = get_svg_contour_rect_area(scanarium, source_path)
        command = [
            scanarium.get_config('programs', 'inkscape'),
            '--export-id=Mask',
            '--export-id-only',
            f'--export-area={contour_area}',
            '--export-background=black',
            '--export-png=%s' % (mask_path),
            source_path,
        ]

        scanarium.run(command)


def mask(scanarium, image, scene, actor):
    masked_file_path = os.path.join(scanarium.get_scenes_dir_abs(), scene,
                                    'actors', actor, '%s-mask.png' % actor)
    generate_mask(scanarium, masked_file_path)

    if not os.path.isfile(masked_file_path):
        raise ScanariumError('SE_SCAN_NO_MASK', 'Failed to find mask')

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


def scan_actor_image(scanarium):
    image = scanarium.get_image()

    qr_rect = None
    scene = None
    actor = None
    iteration = 1
    while qr_rect is None:
        if iteration > 3:
            raise ScanariumError(
                'SE_SCAN_IMAGE_TOO_MANY_ITERATIONS',
                'Taken too many extraction tries from scanned image')

        if image.shape[1] < 150:
            # The image that we're homing in on is really small. It's unlikely
            # to be a proper A4 image, but rather the camera did not detect a
            # proper sheet rect and we're homing in on an (unrelated) small
            # rectangular part of the image. So we abort.
            raise ScanariumError('SE_SCAN_IMAGE_GREW_TOO_SMALL',
                                 'Failed to identify sheet on scanned image')
        try:
            (qr_rect, scene, actor) = extract_qr(image)
            image = rectify_to_qr_parent_rect(scanarium, image, qr_rect)
        except ScanariumError as e:
            if e.code == 'SE_SCAN_NO_QR_CODE':
                # QR code could not get scanned. Probably, because the image
                # is too skew. We try to rectify on the images biggest rect
                # (probably the paper sheet). This should undistort the QR
                # code to be scanable in the next round.
                image = rectify_to_biggest_rect(scanarium, image)
            else:
                raise e

        iteration += 1

    image = orient_image(image)
    image = mask(scanarium, image, scene, actor)
    image = crop(image)
    image = balance(scanarium, image)

    # Finally the image is rectified, landscape, and the QR code is in the
    # lower left-hand corner, and white-balance has been run.

    scanarium.debug_show_image('final', image)
    flavor = save_image(scanarium, image, scene, actor)

    return {
        'scene': scene,
        'actor': actor,
        'flavor': flavor,
    }


def main(scanarium):
    ret = scan_actor_image(scanarium)
    scanarium.reindex_actors_for_scene(ret['scene'])
    return ret


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Scans an processes an image from the camera')
    scanarium.call_guarded(main)
