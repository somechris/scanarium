import logging
import os
import re
import time
import sys

import cv2
import numpy as np
from pyzbar import pyzbar

PAPER_WIDTH=297
PAPER_HEIGHT=210

SCANARIUM_DIR_ABS=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import SCANARIUM_CONFIG
from common import SCENES_DIR_ABS
from common import get_dynamic_directory
from common import get_image
from common import run
del sys.path[0]

logger = logging.getLogger(__name__)


def show_image(title, image):
    if SCANARIUM_CONFIG.getboolean('general', 'debug'):
        cv2.imshow(title, image)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


def scale_image(image):
    scaled_height = 1000
    if image.shape[0] > scaled_height*1.3:
        scale_factor = scaled_height / image.shape[0]
        scaled_width = int(image.shape[1] * scale_factor)
        scaled_dimension = (scaled_width, scaled_height)
        scaled_image = cv2.resize(image, scaled_dimension, cv2.INTER_AREA)
    else:
        scaled_image = image
        scale_factor = 1

    show_image('scaled', scaled_image)

    return (scaled_image, scale_factor)


def find_sheet_points(image):
    cannied = cv2.Canny(image, 30, 400)
    contours, _ = cv2.findContours(cannied, cv2.RETR_LIST,
                                   cv2.CHAIN_APPROX_NONE)

    approx = None
    for contour in sorted(contours, key=cv2.contourArea, reverse=True):
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        if len(approx) == 4:
            # 4 points ... that looks should be turned into a rectangle
            break

    if approx is None:
        return None

    points = approx.reshape(4, 2)
    return points

def distance(pointA, pointB):
    return np.linalg.norm([pointA-pointB])

def rectify(image, points):
    # The following heuristics of classifying the 4 points is based on the
    # assumption that the rectangle is not distorted too much. So if the
    # camera angle is skew, it will fail.
    s = points.sum(axis=1)
    s_tl = points[np.argmin(s)] # smallest sum, is top left
    s_br = points[np.argmax(s)] # biggest sum, is bottom right

    d = np.diff(points, axis=1)
    s_tr = points[np.argmin(d)] # smallest difference, is top right
    s_bl = points[np.argmax(d)] # biggest difference, is bottom left

    source = np.array([s_tl, s_tr, s_br, s_bl], dtype="float32")

    d_w = int(max(distance(s_br, s_bl), distance(s_tr, s_tl))) - 1
    d_h = int(max(distance(s_tr, s_br), distance(s_tl, s_bl))) - 1

    dest = np.array([[0, 0], [d_w, 0], [d_w, d_h], [0, d_h]], dtype="float32")

    M = cv2.getPerspectiveTransform(source, dest)
    return cv2.warpPerspective(image, M, (d_w, d_h))


def turn_landscape(image):
    if image.shape[0] > image.shape[1]:
        image = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    return image

def scale_to_paper_size(image):
    height = image.shape[0]
    width = int(height * PAPER_WIDTH / PAPER_HEIGHT)
    dimension = (width, height)
    return cv2.resize(image, dimension, cv2.INTER_AREA)

def extract_qr(image):
    codes = pyzbar.decode(image)
    if len(codes) != 1:
        return None
    code = codes[0]

    rect = code.rect
    data_raw = code.data.decode('utf-8')
    data = re.sub('[^0-9a-zA-Z:_]+', '_', data_raw)
    (scene, actor) = data.split(':', 1)
    return (rect, scene, actor)

def orient_image(image, left_coordinate):
    if left_coordinate > image.shape[1]/2:
        # QR Code is not on the left half of the picture. As it's landscape
        # (see above), the qr code is in the top-right corner and we need to
        # rotate 180 degrees.
        image = cv2.rotate(image, cv2.ROTATE_180)
    return image

def generate_mask(mask_path):
    source_path = mask_path[:-9] + '.svg'

    if not os.path.isfile(source_path):
        return None

    if not os.path.isfile(mask_path) \
            or os.stat(source_path).st_mtime > os.stat(mask_path).st_mtime:
        command = [
            SCANARIUM_CONFIG['programs']['inkscape'],
            '--export-id=Mask',
            '--export-id-only',
            '--export-area-page',
            '--export-background=black',
            '--export-png=%s' % (mask_path),
            source_path,
            ]

        run(command)


def mask(image, scene, actor):
    masked_file_path = os.path.join(SCENES_DIR_ABS, scene, 'actors', actor,
                                    '%s-mask.png' % actor)
    generate_mask(masked_file_path)

    if not os.path.isfile(masked_file_path):
        return None

    mask = cv2.imread(masked_file_path, 0)
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]), cv2.INTER_AREA)

    (b, g, r) = cv2.split(image)
    masked = cv2.merge((b, g, r, mask))
    return masked

def crop(image):
    y, x = image[:,:,3].nonzero()
    x_min = np.min(x)
    x_max = np.max(x)
    y_min = np.min(y)
    y_max = np.max(y)

    cropped = image[y_min:y_max, x_min:x_max]

    return cropped

def balance(image):
    algo = SCANARIUM_CONFIG['scan']['white_balance'].lower()
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
        ret = None

    return ret

def save_image(image, scene, actor):
    timestamp = str(int(time.time()))
    actor_path = os.path.join(scene, 'actors', actor)
    if not os.path.isdir(os.path.join(SCENES_DIR_ABS, actor_path)):
        # This should never happen, as masking already ensured that the actor
        # source is there. But since we're about to create directories, we're
        # extra warry.
        return None

    dynamic_dir = get_dynamic_directory()
    image_dir = os.path.join(dynamic_dir, 'scenes', actor_path)
    os.makedirs(image_dir, exist_ok=True)
    image_file = os.path.join(image_dir, '%s.png' % timestamp)
    cv2.imwrite(image_file, image)


def scan_actor_image():
    image = get_image()

    show_image('raw_image', image)

    # If the picture is too big (E.g.: from a proper photo camera), edge
    # detection won't work reliably, as the sheet's contour will exhibit too
    # much detail and would get broken down into more than 4 segments. So we
    # scale too big images down. Note though that the scaled image is only
    # used for edge detection. Rectification happens on the original picture.
    (scaled_image, scale_factor) = scale_image(image)
    points = find_sheet_points(scaled_image)

    # Now rectifying using the original (!) image.
    image = rectify(image, points/scale_factor)

    # Now normalizing the rectified image
    image = turn_landscape(image)
    image = scale_to_paper_size(image)
    (qr_rect, scene, actor) = extract_qr(image)
    image = orient_image(image, qr_rect.left)
    image = mask(image, scene, actor)
    image = crop(image)
    image = balance(image)

    # Finally the image is rectified, landscape, and the QR code is in the
    # lower left-hand corner, and white-balance has been run.

    show_image('final', image)
    save_image(image, scene, actor)

def main():
    scan_actor_image()


if __name__ == "__main__":
    main()
