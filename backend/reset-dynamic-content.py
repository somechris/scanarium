#!/usr/bin/env python3
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import re
import logging
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
del sys.path[0]

logger = logging.getLogger(__name__)


def reset_dynamic_content(scanarium, scene):
    scene = re.sub('[^a-zA-Z]+', '-', scene)
    return scanarium.reset_dynamic_content(scene)


def register_arguments(scanarium, parser):
    parser.add_argument('scene',
                        help='The scene to reset dynamic content for. If '
                        'empty, reset content for all scenes.',
                        nargs='?', default='')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments(
        'Resets dynamic content (Deletes scanned actors, ...)',
        register_arguments,
        whitelisted_cgi_fields={'scene': 1})
    scanarium.call_guarded(reset_dynamic_content, args.scene)
