import locale
import time

import cv2

from .ScanariumError import ScanariumError


def debug_show_image(title, image, config):
    if config.get('general', 'debug', 'boolean'):
        cv2.imshow(title, image)
        locale.resetlocale()
        cv2.waitKey(0)
        cv2.destroyAllWindows()


def set_camera_property(config, cap, property, config_key):
    value = config.get('scan', config_key, allow_empty=True, kind='int')
    if value is not None:
        cap.set(property, value)


def get_raw_image(config):
    file_path = config.get('scan', 'source')
    if file_path.startswith('cam:'):
        try:
            cam_nr = int(file_path[4:])
        except ValueError:
            raise ScanariumError('SE_VALUE', 'Failed to parse "%s" of source '
                                 '"%s" to number' % (file_path[4:], file_path))
        cap = cv2.VideoCapture(cam_nr)

        if not cap.isOpened():
            raise ScanariumError('SE_CAP_NOT_OPEN',
                                 'Failed to open camera %d' % (cam_nr))

        # To avoid having to use external programs for basic camera setup, we
        # set the most basic properties right within Scanarium
        set_camera_property(config, cap, cv2.CAP_PROP_FRAME_WIDTH, 'width')
        set_camera_property(config, cap, cv2.CAP_PROP_FRAME_HEIGHT, 'height')

        ret, image = cap.read()

        delay = config.get('scan', 'delay', allow_empty=True, kind='float')
        if delay:
            time.sleep(delay)
            ret, image = cap.read()

        cap.release()
    else:
        image = cv2.imread(file_path)

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
                'Failed to load parameters for undistortion from %s'
                % param_file)

        width, height = image.shape[:2]
        new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(
            cam_matrix, dist_coeffs, (width, height), 1)

        debug_show_image('raw before undistorting', image, config)
        ret = cv2.undistort(ret, cam_matrix, dist_coeffs, None,
                            new_camera_matrix)
    return ret


class Scanner(object):
    def __init__(self, config):
        super(Scanner, self).__init__()
        self._config = config

    def debug_show_image(self, title, image):
        debug_show_image(title, image, self._config)

    def get_image(self):
        raw = get_raw_image(self._config)
        return undistort_image(raw, self._config)
