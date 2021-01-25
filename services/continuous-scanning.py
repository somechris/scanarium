#!/usr/bin/env python3

import json
import logging
import os
import threading
import re
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
    def __init__(self, scanarium, state_file):
        self.scanarium = scanarium
        self.state_file = state_file

        self.now = time.time()

        # Data from previous update run
        self.last_data = None
        self.last_data_start = 0

        # Last non-None data
        self.last_usable_data = None
        self.last_usable_data_position = []
        self.last_usable_data_stable_start = 0
        self.last_usable_data_scanned = False

        self.load_state()
        scanarium.register_for_cleanup(self.store_state)

    def load_state(self):
        if self.state_file:
            try:
                loaded = {}
                with open(self.state_file) as f:
                    loaded = json.load(f)

                self.last_data = loaded.get('last_data', self.last_data)
                self.last_data_start = float(loaded.get(
                    'last_data_start', self.last_data_start))

                self.last_usable_data = loaded.get(
                    'last_usable_data', self.last_usable_data)
                self.last_usable_data_position = [
                    int(e) for e in loaded.get(
                        'last_usable_data_position',
                        self.last_usable_data_position)]
                self.last_usable_data_stable_start = float(loaded.get(
                    'last_usable_data_stable_start',
                    self.last_usable_data_stable_start))
                self.last_usable_data_scanned = bool(loaded.get(
                    'last_usable_data_scanned',
                    self.last_usable_data_scanned))
            except Exception:
                logger.exception(
                    f'Failed to load state file {self.state_file}')
        else:
            logger.info('No state file given. Skipping state loading')

    def store_state(self):
        if self.state_file:
            data = {
                'last_data': self.last_data,
                'last_data_start': self.last_data_start,
                'last_usable_data': self.last_usable_data,
                'last_usable_data_position': self.last_usable_data_position,
                'last_usable_data_stable_start':
                    self.last_usable_data_stable_start,
                'last_usable_data_scanned': self.last_usable_data_scanned,
            }
            scanarium.dump_json(self.state_file, data)

    def is_stable_move(self, new):
        old = self.last_usable_data_position
        x_stable = False
        y_stable = False
        if old and len(old) == 4 and new and len(new) == 4:
            x_allowance = old[2] * STABLE_MOVE_DIMENSION_FACTOR
            x_stable = abs(old[0] - new[0]) <= x_allowance

            y_allowance = old[3] * STABLE_MOVE_DIMENSION_FACTOR
            y_stable = abs(old[1] - new[1]) <= y_allowance

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

    def rect_to_list(self, rect):
        ret = []
        if rect:
            ret = [rect.left, rect.top, rect.width, rect.height]
        return ret

    def update(self, rect, data):
        self.now = time.time()
        rect = self.rect_to_list(rect)

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
                # hence rect might or might not be empty)
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


def scan_forever_with_camera(scanarium, camera, qr_state, image_pause_period):
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

        time.sleep(image_pause_period)


class Watchdog(object):
    def __init__(self, scanarium, qr_state, period, mode, pause_period):
        self.scanarium = scanarium
        self.qr_state = qr_state

        self.period = period
        self.mode = mode
        self.pause_period = pause_period

        self.watchdog = threading.Thread(
            target=self._camera_update_watchdog,
            args=(),
            daemon=True,
            name='camera update watchdog')

    def start(self):
        self.watchdog.start()

    def _bailout(self):
        mode = self.mode
        if mode == 'exit':
            os.kill(os.getpid(), signal.SIGKILL)
        elif mode.startswith('restart-service:'):
            service = re.sub('[^a-zA-Z0-9_-]', '-', mode[16:])
            command = ['/usr/bin/sudo', '--non-interactive',
                       '/usr/sbin/service', service, 'restart']
            self.scanarium.run(command, timeout=60)
        else:
            raise ScanariumError('SE_CONT_SCAN_UNKNOW_BAILOUT',
                                 'Unknown bail out method')

    def _camera_update_watchdog(self):
        pause_end = time.time()
        while True:
            try:
                now = time.time()
                stale_duration = now - max(
                    self.qr_state.get_last_update(), pause_end)
                if stale_duration >= self.period:
                    logger.error(
                        'Failed to get good image since '
                        f'{int(stale_duration)} seconds. Aborting.')
                    pause_end = now + self.pause_period - self.period
                    self._bailout()
                time.sleep(1)
            except Exception:
                logger.exception('Camera update watchdog failed')


def scan_forever(scanarium, qr_state, image_error_pause_period,
                 image_pause_period):
    while True:
        camera = None
        try:
            camera = scanarium.open_camera()
            scan_forever_with_camera(scanarium, camera, qr_state,
                                     image_pause_period)
        except Exception:
            logger.exception('Failed to scan')
            # Something went wrong, like camera being unplugged. So we back off
            # a bit to avoid busy waiting and allow for recovery before
            # retrying.
            time.sleep(image_error_pause_period)
        finally:
            if camera is not None:
                try:
                    scanarium.close_camera(camera)
                except Exception:
                    logger.exception('Failed to close camera')
            time.sleep(image_error_pause_period)


def register_arguments(scanarium, parser):
    def get_conf(key, allow_empty=False):
        return scanarium.get_config('service:continuous-scanning', key,
                                    allow_empty=allow_empty)

    parser.add_argument('--bailout-period', metavar='DURATION', type=int,
                        help='Exit if no image could get read after DURATION '
                        'seconds. This is useful on camera pipelines that '
                        'cannot gracefully recover. 0 means no bailout',
                        default=get_conf('bailout_period'))
    parser.add_argument('--bailout-mode', metavar='MODE',
                        help='If `exit`, bail out by stopping this program. '
                        'If `restart-service:FOO`, bail out by restarting '
                        'service `FOO`.',
                        default=get_conf('bailout_mode'))
    parser.add_argument('--bailout-pause-period', metavar='DURATION',
                        type=float, help='If a bailout got triggered, wait at '
                        'least this long before triggering a new bailout.',
                        default=get_conf('bailout_pause_period'))
    parser.add_argument('--image-error-pause-period', metavar='DURATION',
                        type=float, help='Time (in seconds) to pause after '
                        'getting an image from the camera failed.',
                        default=get_conf('image_pause_period'))
    parser.add_argument('--image-pause-period', metavar='DURATION', type=float,
                        help='Time (in seconds) to pause after processing an '
                        'image before grabbing the next. This is useful to '
                        'lessen the load of this service.',
                        default=get_conf('image_pause_period'))
    parser.add_argument('--state-file', metavar='FILE',
                        help='The file to store/load state to/from. If '
                        'empty, state storing/loading is skipped.',
                        default=get_conf('state_file', allow_empty=True))


def run(scanarium, args):
    qr_state = QrState(scanarium, args.state_file)
    if args.bailout_period:
        Watchdog(
            scanarium, qr_state, args.bailout_period, args.bailout_mode,
            args.bailout_pause_period).start()
    scan_forever(scanarium, qr_state, args.image_error_pause_period,
                 args.image_pause_period)


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments('Continuously scans for images from '
                                      'the camera',
                                      register_arguments)
    scanarium.call_guarded(run, args, check_caller=False)
