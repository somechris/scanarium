#!/usr/bin/env python3

import logging
import os
import sys

import cv2
import numpy as np

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def add_text(image, text, position=(5, 5), color=(0, 0, 255)):
    font = cv2.FONT_HERSHEY_SIMPLEX
    fontScale = image.shape[1] / 2000
    position = (int(image.shape[1] * position[0] / 100),
                int(image.shape[0] * position[1] / 100))
    return cv2.putText(image, text, position, font, fontScale, color)


def add_qr(scanarium, image):
    try:
        (qr_rect, qr_data) = scanarium.extract_qr(image)
        qr_color = (0, 255, 0)
    except ScanariumError:
        qr_rect = None
        qr_data = '<not found>'
        qr_color = (0, 0, 255)

    if qr_rect is not None:
        points = np.array([
            [qr_rect.left, qr_rect.top],
            [qr_rect.left, qr_rect.top + qr_rect.height],
            [qr_rect.left + qr_rect.width, qr_rect.top + qr_rect.height],
            [qr_rect.left + qr_rect.width, qr_rect.top],
        ]).reshape((-1, 1, 2))
        image = cv2.polylines(image, [points], True, qr_color, thickness=3)

    image = add_text(image, 'QR-data: ' + qr_data, position=(2, 3),
                     color=qr_color)
    return image


def show_source(scanarium, mark_qr):
    camera = None
    try:
        camera = scanarium.open_camera()
        key = -1
        while key == -1:
            image = scanarium.get_image(camera)
            if mark_qr:
                image = add_qr(scanarium, image)
            title = 'Raw source (Press any key to quit)'
            cv2.imshow(title, image)
            key = cv2.waitKey(25)
    finally:
        if camera is not None:
            scanarium.close_camera(camera)


def register_arguments(parser):
    parser.add_argument('--mark-qr', help='Marks the QR-Code, if found',
                        action='store_true')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments('Shows the camera picture on screen',
                                      register_arguments)
    scanarium.call_guarded(show_source, args.mark_qr)
