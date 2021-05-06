import base64
import os
import cv2

from .environment import CanaryTestCase


class ScanDataCanaryTestCase(CanaryTestCase):
    def run_scan_data(self, dir, file):
        with open(os.path.join(dir, file), 'rb') as f:
            raw_data = f.read()

        encoded = base64.standard_b64encode(raw_data).decode()

        return self.run_cgi(dir, 'scan-data', [encoded])

    def assertRoughlyEqual(self, actual, expected, scale=None,
                           allowed_deviation=0.02):
        if scale is None:
            scale = expected
        self.assertGreaterEqual(actual, expected - scale * allowed_deviation)
        self.assertLessEqual(actual, expected + scale * allowed_deviation)

    def assertColor(self, image, x, y, expected):
        pixel = image[y][x]
        if expected == 'red':
            expected = [0, 0, 255]
        elif expected == 'green':
            expected = [0, 255, 0]
        elif expected == 'blue':
            expected = [255, 0, 0]

        for i in range(3):
            try:
                self.assertRoughlyEqual(pixel[i], expected[i], scale=255,
                                        allowed_deviation=5)
            except self.failureException as e:
                self.fail(f'Pixel at x: {x}, y: {y} is {pixel} and does not '
                          f'match {expected} ({e.args})')

    def assertMarker(self, image, marker, x_factor, y_factor):
        unscaled_center_x, unscaled_center_y, unscaled_width, color = marker
        center_x = round(unscaled_center_x * x_factor)
        center_y = round(unscaled_center_y * y_factor)
        self.assertColor(image, center_x, center_y, color)

    def assertScanOk(self, dir, scene='space', actor='SimpleRocket',
                     dimension=[0, 0], markers=[]):
        scan_target_dir = os.path.join(dir, 'dynamic', 'scenes', scene,
                                       'actors', actor)
        scan_result_file = None
        for file in os.listdir(scan_target_dir):
            if file.endswith('.png'):
                # A png in the scan target directory. That has to be the
                # result of the scan.
                scan_result_file = os.path.join(scan_target_dir, file)

        self.assertIsNotNone(scan_result_file)
        image = cv2.imread(scan_result_file)

        # Scanned image has been loaded. Now on to testing the scan result
        # (image.shape is (height, width, ...), dimension is (width, height).
        self.assertRoughlyEqual(image.shape[1], dimension[0])
        self.assertRoughlyEqual(image.shape[0], dimension[1])

        x_factor = image.shape[1] / dimension[0]
        y_factor = image.shape[0] / dimension[1]
        for marker in markers:
            self.assertMarker(image, marker, x_factor, y_factor)

    def template_test_file_type(self, file_type):
        fixture = f'space-SimpleRocket-optimal.{file_type}'
        with self.prepared_environment(fixture) as dir:
            self.run_scan_data(dir, fixture)

            self.assertScanOk(dir,
                              dimension=[455, 313],
                              markers=[
                                  [3, 155, 5, 'red'],
                                  [451, 3, 5, 'green'],
                                  [451, 308, 5, 'blue'],
                              ])

    def test_ok_png(self):
        self.template_test_file_type('png')

    def test_ok_jpg(self):
        self.template_test_file_type('jpg')
