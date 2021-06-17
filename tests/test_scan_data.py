# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import unittest
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

    def assertErrorCode(self, code, command_output, dir):
        self.assertIn(code, command_output['stdout'])
        command_log_file = os.path.join(dir, 'dynamic', 'command-log.json')
        self.assertFileContains(command_log_file, code)

    def template_test_file_type(self, file_type, pipeline=None, variant='optimal'):
        fixture = f'space-SimpleRocket-{variant}.{file_type}'
        config = {'scan': {f'permit_file_type_{file_type}': True}}
        if pipeline is not None:
            config['scan'][f'pipeline_file_type_{file_type}'] = pipeline
        with self.prepared_environment(fixture, test_config=config) as dir:
            self.run_scan_data(dir, fixture)

            if file_type == 'pdf':
                self.assertScanOk(dir,
                                  dimension=[539, 371],
                                  markers=[
                                      [4, 185, 5, 'red'],
                                      [335, 365, 5, 'green'],
                                      [335, 5, 5, 'blue'],
                                  ])
            elif variant == '35':
                self.assertScanOk(dir,
                                  dimension=[304, 209],
                                  markers=[
                                      [2, 104, 5, 'red'],
                                      [300, 3, 5, 'green'],
                                      [300, 206, 5, 'blue'],
                                  ])
            else:
                self.assertScanOk(dir,
                                  dimension=[455, 313],
                                  markers=[
                                      [3, 155, 5, 'red'],
                                      [451, 3, 5, 'green'],
                                      [451, 308, 5, 'blue'],
                                  ])

            command_log_file = os.path.join(dir, 'dynamic', 'command-log.json')
            logged_result = self.get_json_file_contents(command_log_file)[0]
            self.assertTrue(logged_result['is_ok'])
            self.assertEqual(logged_result['command'], 'space')
            self.assertEqual(logged_result['parameters'], ['SimpleRocket'])

    def test_ok_png_native(self):
        self.template_test_file_type('png', pipeline='native')

    def test_ok_png_35_native(self):
        self.template_test_file_type('png', pipeline='native', variant='35')

    def test_ok_png_90_native(self):
        self.template_test_file_type('png', pipeline='native', variant='90')

    def test_ok_png_180_native(self):
        self.template_test_file_type('png', pipeline='native', variant='180')

    def test_ok_png_270_native(self):
        self.template_test_file_type('png', pipeline='native', variant='270')

    def test_ok_png_convert(self):
        self.template_test_file_type('png', pipeline='convert')

    def test_ok_jpg_native(self):
        self.template_test_file_type('jpg', pipeline='native')

    def test_ok_jpg_convert(self):
        self.template_test_file_type('jpg', pipeline='convert')

    @unittest.skipIf('TEST_SKIP_HEIC' in os.environ
                     and os.environ['TEST_SKIP_HEIC'].lower() == 'yes',
                     'Environment variable TEST_SKIP_HEIC is True')
    def test_ok_heic(self):
        self.template_test_file_type('heic')

    def test_ok_pdf_convert(self):
        self.template_test_file_type('pdf', pipeline='convert')

    def test_ok_pdf_pdftoppm(self):
        self.template_test_file_type('pdf', pipeline='pdftoppm')

    def test_fail_pipeline_os_error(self):
        fixture = 'space-SimpleRocket-optimal.png'
        config = {
            'programs': {
                'convert_untrusted': os.path.join('%DYNAMIC_DIR%', 'foo'),
                },
            'scan': {
                'permit_file_type_png': True,
                'pipeline_file_type_png': 'convert',
                },
            }
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_PIPELINE_OS_ERROR', ret, dir)

    def test_fail_pipeline_os_error(self):
        fixture = 'space-SimpleRocket-optimal.png'
        config = {
            'programs': {
                'convert_untrusted': '/bin/false',
                },
            'scan': {
                'permit_file_type_png': True,
                'pipeline_file_type_png': 'convert',
                },
            }
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_PIPELINE_RETURN_VALUE', ret, dir)

    def test_fail_no_rectangle(self):
        fixture = 'blank-white.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_NO_QR_CODE', ret, dir)

    def test_fail_only_rectangle(self):
        fixture = 'only-rect.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_NO_QR_CODE', ret, dir)

    def test_fail_only_qr(self):
        fixture = 'only-qr.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_NO_APPROX', ret, dir)

    def test_fail_too_small(self):
        fixture = 'too-small.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_IMAGE_TOO_SMALL', ret, dir)

    def test_fail_grew_too_small_fine(self):
        fixture = 'grew-too-small.png'
        config = {
            'scan': {'permit_file_type_png': True},
            'debug': {'fine_grained_errors': True},
            }
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_IMAGE_GREW_TOO_SMALL', ret, dir)

    def test_fail_grew_too_small_general(self):
        fixture = 'grew-too-small.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_NO_QR_CODE', ret, dir)

    def test_fail_too_many_iterations_fine(self):
        fixture = 'too-many-iterations.png'
        config = {
            'scan': {'permit_file_type_png': True},
            'debug': {'fine_grained_errors': True},
            }
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_IMAGE_TOO_MANY_ITERATIONS', ret, dir)

    def test_fail_too_many_iterations_general(self):
        fixture = 'too-many-iterations.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_NO_QR_CODE', ret, dir)

    def test_fail_too_many_qr_codes(self):
        fixture = 'too-many-qrs.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_TOO_MANY_QR_CODES', ret, dir)

    def test_fail_qr_foo(self):
        fixture = 'qr-foo.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_SCAN_MISFORMED_QR_CODE', ret, dir)

    def test_fail_qr_foo_bar_baz(self):
        fixture = 'qr-foo-bar-baz.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_UNKNOWN_SCENE', ret, dir)

    def test_fail_qr_space_foo(self):
        fixture = 'qr-space-foo.png'
        config = {'scan': {'permit_file_type_png': True}}
        with self.prepared_environment(fixture, test_config=config) as dir:
            ret = self.run_scan_data(dir, fixture)
            self.assertErrorCode('SE_UNKNOWN_ACTOR', ret, dir)
