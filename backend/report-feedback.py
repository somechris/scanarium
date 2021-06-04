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


def report_feedback(scanarium, description, lastFailedUpload):
    target = scanarium.get_config('cgi:report-feedback', 'target')
    if target == 'stderr':
        print(description, file=sys.stderr)
    elif target == 'log':
        log_filename = scanarium.get_log_filename('feedback.txt')
        with open(log_filename, 'wt') as f:
            f.write(description)
        if lastFailedUpload:
            img_filename = log_filename[:-4] + '-last-failed-upload'
            with open(img_filename, 'wb') as f:
                f.write(base64.standard_b64decode(lastFailedUpload))
            format = scanarium.guess_image_format(img_filename)
            if format:
                os.rename(img_filename, f'{img_filename}.{format}')
    else:
        raise ScanariumError('SE_UNKNOWN_FEEDBACK_TARGET',
                             'Unknown feedback target "{feedback_target}"',
                             {'feedback_target': target})
    return True


def register_arguments(scanarium, parser):
    parser.add_argument('DESCRIPTION', help='The textual part of the feedback')
    parser.add_argument('LAST_FAILED_UPLOAD', nargs='?',
                        help='The last failed upload')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments(
        'Reports feedback',
        register_arguments,
        whitelisted_cgi_fields={'description': 1, 'lastFailedUpload': 2})
    scanarium.call_guarded(report_feedback, args.DESCRIPTION,
                           args.LAST_FAILED_UPLOAD)
