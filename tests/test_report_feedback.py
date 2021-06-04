# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import base64
import os

from .environment import CanaryTestCase


class ReportFeedbackTestCase(CanaryTestCase):
    def run_report_feedback(self, dir, feedback, file):
        args = [feedback]
        if file:
            with open(os.path.join(dir, file), 'rb') as f:
                raw_data = f.read()
            encoded = base64.standard_b64encode(raw_data).decode()
            args.append(encoded)

        return self.run_cgi(dir, 'report-feedback', args)

    def run_test_report_feedback(self, feedback, file_type=None):
        fixture = None
        if file_type:
            fixture = f'space-SimpleRocket-optimal.{file_type}'
            expected_file_suffix = '-feedback-last-failed-upload'
            if file_type != 'txt':
                expected_file_suffix += f'.{file_type}'
        config = {
            'cgi:report-feedback':  {
                'target': 'log',
                },
            }
        with self.prepared_environment(fixture, test_config=config) as dir:
            self.run_report_feedback(dir, feedback, fixture)

            log_dir = os.path.join(dir, 'log')
            year_dir = os.path.join(log_dir, os.listdir(log_dir)[0])
            month_dir = os.path.join(year_dir, os.listdir(year_dir)[0])
            day_dir = os.path.join(month_dir, os.listdir(month_dir)[0])

            found_txt = False
            found_image = False
            for file in os.listdir(day_dir):
                full_file_name = os.path.join(day_dir, file)
                if file[-13:] == '-feedback.txt':
                    self.assertFalse(
                        found_txt,
                        f'found 2 txt files: "{found_txt}" and '
                        f'"{full_file_name}"')
                    found_txt = file
                    self.assertFileContents(full_file_name, feedback)
                elif file_type and file[-len(expected_file_suffix):] == \
                        expected_file_suffix:
                    found_image = file
                    self.assertSameFileContents(
                        full_file_name,
                        self.get_fixture_file_name(fixture))
                else:
                    self.fail(f'Found unexpected file "{full_file_name}"')

            self.assertTrue(found_txt, 'Failed to find feedback text file')
            if file_type:
                self.assertTrue(found_image,
                                'Failed to find feedback image file')

    def template_test_file_type(self, file_type, pipeline=None):
        fixture = f'space-SimpleRocket-optimal.{file_type}'
        config = {'scan': {f'permit_file_type_{file_type}': True}}
        if pipeline is not None:
            config['scan'][f'pipeline_file_type_{file_type}'] = pipeline
        with self.prepared_environment(fixture, test_config=config) as dir:
            self.run_scan_data(dir, fixture)

    def test_feedback_no_file(self):
        self.run_test_report_feedback('foo')

    def test_feedback_png_file(self):
        self.run_test_report_feedback('foo', 'png')

    def test_feedback_jpg_file(self):
        self.run_test_report_feedback('foo', 'jpg')

    def test_feedback_txt_file(self):
        self.run_test_report_feedback('foo', 'txt')
