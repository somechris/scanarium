#!/usr/bin/env python3
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import base64
import logging
import os
import sys
import tempfile

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
del sys.path[0]
from scan import scan_image

logger = logging.getLogger(__name__)


def scan_data(scanarium, data):
    with tempfile.TemporaryDirectory(prefix='scanarium-scan-data-') as dir:
        image_file = os.path.join(dir, 'image')
        with open(image_file, 'wb') as f:
            f.write(base64.standard_b64decode(data))
        # Temporarily switching the image source to the new image for scanning
        scanarium.set_config('scan', 'source', f'image:{image_file}')

        # As we switched from the configured image source to the passed image,
        # the calibration data for the configured image source no longer fits,
        # and we drop it as it may otherwise distort colors/geometry.
        scanarium.set_config('scan', 'calibration_xml_file', '')
        scanarium.set_config('scan', 'max_brightness', '')

        return scan_image(scanarium)


def register_arguments(scanarium, parser):
    parser.add_argument('DATA', help='The image data to scan')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments(
        'Scans an processes an image from a parameter',
        register_arguments,
        whitelisted_cgi_fields={'data': 1})
    scanarium.call_guarded(scan_data, args.DATA)
