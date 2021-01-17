#!/usr/bin/env python3

import logging
import os
import threading
import sys
import signal
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
        self.now = time.time()

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

    def get_last_update(self):
        return self.now


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


def camera_update_watchdog(qr_state, bailout_period):
    while True:
        try:
            stale_duration = time.time() - qr_state.get_last_update()
            if stale_duration >= bailout_period:
                logger.error(
                    f'Failed to get good image since {int(stale_duration)} '
                    'seconds. Aborting.')
                os.kill(os.getpid(), signal.SIGKILL)
            time.sleep(1)
        except Exception:
            logger.exception('Camera update watchdog failed')


def start_camera_update_watchdog(qr_state, bailout_period):
    watchdog = threading.Thread(
        target=camera_update_watchdog,
        args=(qr_state, bailout_period),
        daemon=True,
        name='camera update watchdog')
    watchdog.start()


def scan_forever(scanarium, qr_state):
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
                try:
                    scanarium.close_camera(camera)
                except Exception:
                    logger.exception('Failed to close camera')
            time.sleep(2)


def register_arguments(scanarium, parser):
    parser.add_argument('--bailout-period', metavar='DURATION', type=int,
                        help='Exit if no image could get read after DURATION '
                        'seconds. This is useful on camera pipelines that '
                        'cannot gracefully recover. 0 means no bailout',
                        default=0)


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments('Continuously scans for images from '
                                      'the camera',
                                      register_arguments)

    qr_state = QrState()
    if args.bailout_period:
        start_camera_update_watchdog(qr_state, args.bailout_period)
    scan_forever(scanarium, qr_state)
