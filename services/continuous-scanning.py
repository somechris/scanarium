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


class QrState(object):
    def __init__(self):
        # Data from previous update run
        self.last_data = None
        self.last_data_start = 0

        # Last non-None data
        self.last_usable_data = None
        self.last_usable_data_position = 0
        self.last_usable_data_stable_start = 0
        self.last_usable_data_scanned = False

    def is_stable_move(self, new):
        old = self.last_usable_data_position
        if old is None:
            x_stable = False
            y_stable = False
        else:
            x_allowance = old.width * STABLE_MOVE_DIMENSION_FACTOR
            x_stable = abs(old.left - new.left) <= x_allowance

            y_allowance = old.height * STABLE_MOVE_DIMENSION_FACTOR
            y_stable = abs(old.top - new.top) <= y_allowance

        return x_stable and y_stable

    def set_last_usable(self, rect, data):
        self.last_usable_data = data
        self.last_usable_data_position = rect
        self.last_usable_data_stable_start = self.now
        self.last_usable_data_scanned = False

    def reset_last_usable(self):
        self.set_last_usable(None, None)

    def reset_stabilization(self, rect):
        self.last_usable_data_position = rect
        self.last_usable_data_stable_start = self.now
        # No resetting of last_usable_data_scanned, because if we had scanned
        # before, a short occlusion or hiccup should not trigger a scan again.

    def update(self, rect, data):
        self.now = time.time()

        if self.last_usable_data != data:
            # Data is different from last non-None data (but data need not be
            # different from the data of the last call of this method)
            if data is not None:
                # New, usable data is present. We need to pick it up.
                self.set_last_usable(rect, data)
            elif self.last_data is None \
                    and self.now - self.last_data_start > 1.5:
                # data is None since too long. So we no longer consider it a
                # hiccup or temporary occlusion.
                self.reset_last_usable()

        else:
            # Data matches last usable data (but need not match data from last
            # call of this method, e.g.: if in the last call the QR code was
            # occluded and hence data was None).
            if self.last_data is None:
                # Last run, the scanning failed, so we need to
                # start stabilization again.
                # (Note that we check on last_data, not data. So data, and
                # hence rect might or might not be None)
                self.reset_stabilization(rect)

            if data is not None:
                if not self.is_stable_move(rect):
                    # Sheet is still moving too much. So we reset stablization
                    self.reset_stabilization(rect)

        # Bookkeeping of data for next call of this method
        if data != self.last_data:
            self.last_data_start = self.now
        self.last_data = data

    def get_stable_duration(self):
        ret = 0
        if self.last_data is not None:
            ret = self.now - self.last_usable_data_stable_start
        return ret

    def should_scan(self):
        return self.get_stable_duration() > 1 \
            and not self.last_usable_data_scanned

    def mark_scanned(self):
        self.last_usable_data_scanned = True


def scan_forever_with_camera(scanarium, camera, qr_state):
    alerted_no_approx = False

    def should_skip_exception(e):
        ret = False
        if isinstance(e, ScanariumError) \
                and e.code == 'SE_SCAN_NO_APPROX':
            ret = qr_state.get_stable_duration() <= 3 or alerted_no_approx

        return ret

    while True:
        image = scanarium.get_image(camera)
        try:
            (qr_rect, data) = scanarium.extract_qr(image)
        except ScanariumError as e:
            if e.code == 'SE_SCAN_NO_QR_CODE':
                data = None
                qr_rect = None
                pass
            else:
                raise e

        qr_state.update(qr_rect, data)

        if qr_state.should_scan():
            try:
                try:
                    logger.debug(f'Processing image "{data}" ...')
                    result = scanarium.process_image_with_qr_code(
                        image, qr_rect, data, should_skip_exception)

                    if result.is_ok:
                        logger.debug(f'Processed image "{data}": ok')
                        qr_state.mark_scanned()
                    else:
                        if result.error_code == 'SE_SCAN_NO_APPROX':
                            logger.info('Failed to find rectangle contour')
                            alerted_no_approx = True

                except ScanariumError as e:
                    if e.code == 'SE_SKIPPED_EXCEPTION':
                        pass
                    else:
                        raise e
            except Exception:
                logger.exception('Failed to process scanned image')
        else:
            alerted_no_approx = False


def scan_forever(scanarium):
    # We keep qr_state across camera re-opening to avoid re-scans if a camera
    # gets unplugged and replugged again, while a usable sheet is lying in
    # front of the lens.
    qr_state = QrState()

    while True:
        camera = None
        try:
            camera = scanarium.open_camera()
            scan_forever_with_camera(scanarium, camera, qr_state)
        except Exception:
            logger.exception('Failed to scan')
            # Something went wrong, like camera being unplugged. So we back off
            # a bit to avoid busy waiting and allow for recovery before
            # retrying.
            time.sleep(2)
        finally:
            if camera is not None:
                scanarium.close_camera(camera)


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Continuously scans for images from the camera')
    scan_forever(scanarium)
