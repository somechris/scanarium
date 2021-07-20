#!/usr/bin/env python3
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import base64
import logging
import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def report_feedback(scanarium, message, email, lastFailedUpload, userAgent):
    target = scanarium.get_config('cgi:report-feedback', 'target')
    if target == 'stderr':
        print(message, file=sys.stderr)
    elif target == 'log':
        filename_base = scanarium.get_log_filename('feedback')
        log_filename = filename_base + '.txt'
        with open(log_filename, 'wt') as f:
            f.write(message)
        if email:
            email_filename = filename_base + '-email.txt'
            with open(email_filename, 'wt') as f:
                f.write(email)
        if lastFailedUpload:
            img_filename = filename_base + '-last-failed-upload'
            with open(img_filename, 'wb') as f:
                f.write(base64.standard_b64decode(lastFailedUpload))
            format = scanarium.guess_image_format(img_filename)
            if format:
                os.rename(img_filename, f'{img_filename}.{format}')
        if userAgent:
            scanarium.dump_text(filename_base + '-user-agent.txt', userAgent)
    else:
        raise ScanariumError('SE_UNKNOWN_FEEDBACK_TARGET',
                             'Unknown feedback target "{feedback_target}"',
                             {'feedback_target': target})
    return True


def register_arguments(scanarium, parser):
    parser.add_argument('MESSAGE', help='The textual part of the feedback')
    parser.add_argument('EMAIL', nargs='?',
                        help='The email to send the answer to')
    parser.add_argument('LAST_FAILED_UPLOAD', nargs='?',
                        help='The last failed upload')
    parser.add_argument('USER_AGENT', nargs='?',
                        help='The browser identification')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments(
        'Reports feedback',
        register_arguments,
        whitelisted_cgi_fields={
            'message': 1, 'email': 2, 'lastFailedUpload': 3, 'userAgent': 4})
    scanarium.call_guarded(report_feedback, args.MESSAGE, args.EMAIL,
                           args.LAST_FAILED_UPLOAD, args.USER_AGENT)
