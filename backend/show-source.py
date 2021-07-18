#!/usr/bin/env python3
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import os
import sys
import re

import cv2
import numpy as np

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def add_text(image, label, value, position=0):
    font = cv2.FONT_HERSHEY_SIMPLEX
    fontScale = image.shape[1] / 2000
    position = (int(image.shape[1] * 2 / 100),
                int(image.shape[0] * (3 + 5 * position) / 100))
    color = (0, 255, 0)
    if value is True:
        value = 'found'
    if value is None or value is False:
        value = '<not found>'
        color = (0, 0, 255)
    text = label + ': ' + value
    return cv2.putText(image, text, position, font, fontScale, color)


def add_poly(image, points, color, thickness=3):
    points = points.reshape((-1, 1, 2)).astype(np.int32)
    image = cv2.polylines(image, [points], True, color, thickness)
    return image


def add_mark(image, label, value, points, position):
    image = add_text(image, label, value, position)

    if points is not None:
        color = tuple(255 if i == position else 0 for i in range(3))
        image = add_poly(image, points, color, position)

    return image


def add_qr(scanarium, image, original_image):
    points = None
    try:
        (qr_rect, qr_data) = scanarium.extract_qr(original_image)
    except ScanariumError:
        qr_rect = None
        qr_data = None

    if qr_rect is not None:
        points = np.array([
            [qr_rect.left, qr_rect.top],
            [qr_rect.left, qr_rect.top + qr_rect.height],
            [qr_rect.left + qr_rect.width, qr_rect.top + qr_rect.height],
            [qr_rect.left + qr_rect.width, qr_rect.top],
        ])
        image = add_poly(image, points, (0, 255, 0))

    image = add_mark(image, 'QR-data', qr_data, points, 0)
    return image, qr_rect, qr_data


def add_qr_parent_rect(scanarium, image, original_image, qr_rect):
    points = None
    if qr_rect is not None:
        try:
            points = scanarium.rectify_to_qr_parent_rect(
                original_image, qr_rect, yield_only_points=True)
        except ScanariumError:
            points = None

    image = add_mark(image, 'QR parent rect', points is not None, points, 1)
    return image


def add_biggest_rect(scanarium, image, original_image):
    try:
        points = scanarium.rectify_to_biggest_rect(
            original_image, yield_only_points=True)
    except ScanariumError:
        points = None

    image = add_mark(image, 'Biggest rect', points is not None, points, 2)
    return image


def show_source(scanarium, mark, store_final):
    camera = None
    original_image = None
    title = 'Source' + (' with detected features' if mark else '')
    hide_image_key = re.sub('[^0-9a-z_]+', '_', 'hide_image_' + title.lower())
    show_image = not scanarium.get_config('debug', hide_image_key, 'boolean')
    exception_message = None
    last_exception_message = None
    try:
        camera = scanarium.open_camera()
        while True:
            original_image = scanarium.get_image(camera)
            image = original_image.copy()
            if mark:
                image, qr_rect, qr_data = add_qr(scanarium, image,
                                                 original_image)
                image = add_qr_parent_rect(scanarium, image, original_image,
                                           qr_rect)
                image = add_biggest_rect(scanarium, image, original_image)
                if qr_rect:
                    try:
                        (command, parameter) = qr_data.split(':', 1)
                        for mask_alpha in [0.6, 0.01]:
                            masked_image = scanarium.actor_image_pipeline(
                                original_image, qr_rect, command, parameter,
                                visualized_alpha=mask_alpha)
                            scanarium.debug_show_image(
                                f'Masked@{mask_alpha}', masked_image)
                        last_exception_message = None

                    except ScanariumError as e:
                        exception_message = e.message

                    except Exception as e:
                        exception_message = str(e)

                    if exception_message != last_exception_message:
                        print(exception_message)
                        last_exception_message = exception_message
                        exception_message = None
                else:
                    last_exception_message = None

            if show_image:
                cv2.imshow(title, image)
            cv2.waitKey(25)
    finally:
        if store_final and original_image is not None:
            filename = scanarium.get_timestamp_for_filename() + '.png'
            cv2.imwrite(filename, original_image)
            logger.info('Stored last image as "%s"' % (filename))
        if camera is not None:
            scanarium.close_camera(camera)


def register_arguments(scanarium, parser):
    parser.add_argument('--mark', help='Marks the QR-Code and suitable '
                        'contours, if found',
                        action='store_true')
    parser.add_argument('--store-final', help='Writes the final image to disk',
                        action='store_true')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments('Shows the camera picture on screen',
                                      register_arguments)
    scanarium.call_guarded(show_source, args.mark, args.store_final)
