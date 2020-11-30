#!/usr/bin/env python3

import logging
import os
import sys
import time

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
from scanarium import ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)

STABLE_MOVE_DIMENSION_FACTOR = 0.05


def is_stable_move(old, new):
    x_allowance = old.width * STABLE_MOVE_DIMENSION_FACTOR
    x_stable = abs(old.left - new.left) <= x_allowance

    y_allowance = old.height * STABLE_MOVE_DIMENSION_FACTOR
    y_stable = abs(old.top - new.top) <= y_allowance

    return x_stable and y_stable


def scan_forever(scanarium):
    camera = scanarium.open_camera()

    last_data = None
    last_data_start = 0

    last_usable_data = None
    last_usable_data_position = 0
    last_usable_data_stable_start = 0
    last_usable_data_scanned = False

    try:
        while True:
            image = scanarium.get_image(camera)
            now = time.time()
            try:
                (qr_rect, data) = scanarium.extract_qr(image)
            except ScanariumError as e:
                if e.code == 'SE_SCAN_NO_QR_CODE':
                    data = None
                    qr_rect = None
                    pass
                else:
                    raise e

            if last_usable_data != data:
                if data is not None or (
                        last_data is None and now - last_data_start > 1.5):
                    # Either data is something new and usable, or it failed to
                    # scan a code so long that it's not a temporary
                    # occlusion/hiccup. Eitherway, we reset usable data to
                    # current data.
                    last_usable_data = data
                    last_usable_data_position = qr_rect
                    last_usable_data_stable_start = now
                    last_usable_data_scanned = False
            else:
                if last_data is None:
                    # Last run, the scanning failed, so we need to
                    # start stabilization again.
                    last_usable_data_position = qr_rect
                    last_usable_data_stable_start = now
                    # No resetting of last_usable_data_scanned,
                    # because if we had scanned before, a short
                    # occlusion or hiccup should not scan again.
                if data is not None:
                    if is_stable_move(last_usable_data_position, qr_rect):
                        if now - last_usable_data_stable_start > 1:
                            if not last_usable_data_scanned:
                                try:
                                    logger.debug(
                                        f'Processing image "{data}" ...')
                                    scanarium.process_image_with_qr_code(
                                        image, qr_rect, data)

                                    logger.debug(
                                        f'Processed image "{data}": ok')

                                    last_usable_data_scanned = True
                                except Exception:
                                    logger.exception('Failed to scan')

                    else:
                        # Instable move with usable data. So we need to reset
                        # stabilization period.
                        last_usable_data_position = qr_rect
                        last_usable_data_stable_start = now
                        # No resetting of last_usable_data_scanned, because an
                        # instable move should not trigger re-scanning

            if data != last_data:
                last_data_start = now
            last_data = data

            now = time.time()
    finally:
        scanarium.close_camera(camera)


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Continuously scans for images from the camera')
    scan_forever(scanarium)
