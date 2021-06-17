#!/usr/bin/env python3
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
from scanarium import ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def scan_image_no_outer_logging(scanarium):
    image = scanarium.get_image()

    qr_rect = None
    data = None
    iteration = 1
    minimal_width = scanarium.get_config(
        'scan', 'min_raw_width_trip', kind='int')
    fine_grained_errors = scanarium.get_config(
        'debug', 'fine_grained_errors', kind='boolean')
    while qr_rect is None:
        try:
            (qr_rect, data) = scanarium.extract_qr(image)
        except ScanariumError as e:
            if e.code == 'SE_SCAN_NO_QR_CODE':
                # QR code could not get scanned. Probably, because the image
                # is too skew. We try to rectify on the images biggest rect
                # (probably the paper sheet). This should undistort the QR
                # code to be scanable in the next round.

                if iteration > 3:
                    if fine_grained_errors:
                        raise ScanariumError(
                            'SE_SCAN_IMAGE_TOO_MANY_ITERATIONS',
                            'Taken too many extraction tries from scanned '
                            'image')
                    else:
                        raise e

                image = scanarium.rectify_to_biggest_rect(image)

                if image.shape[1] < minimal_width:
                    # The image that we're homing in on is really small. It's
                    # unlikely to be a proper A4 image, but rather the camera
                    # did not detect a proper sheet rect and we're homing in on
                    # an (unrelated) small rectangular part of the image. So we
                    # abort.
                    if fine_grained_errors:
                        raise ScanariumError(
                            'SE_SCAN_IMAGE_GREW_TOO_SMALL',
                            'Failed to identify sheet on scanned image')
                    else:
                        raise e
            else:
                raise e

        iteration += 1

    return scanarium.process_image_with_qr_code(image, qr_rect, data)


def scan_image(scanarium):
    ret = None
    try:
        ret = scan_image_no_outer_logging(scanarium)
    except Exception:
        ret = scanarium.get_command_logger().log(exc_info=sys.exc_info())
    return ret


def main(scanarium):
    return scan_image(scanarium)


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Scans an processes an image from the camera')
    scanarium.call_guarded(main)
