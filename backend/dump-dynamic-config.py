#!/usr/bin/env python3

import json
import os
import logging
import re
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def dump(scanarium, file):
    local_file = None
    if file == 'dynamic/command-log.json':
        local_file = os.path.join(
            scanarium.get_dynamic_directory(), 'command-log.json')
    else:
        parts = file.split('/', 3)
        if parts[0:2] == ['dynamic', 'scenes'] and \
                parts[3] in ['actors.json', 'actors-latest.json']:
            parts[2] = re.sub('[^a-zA-Z]', '-', parts[2])
            local_file = os.path.join(
                scanarium.get_dynamic_directory(),
                *parts[1:])

    if local_file is None:
        raise ScanariumError('SE_DYNAMIC_CONFIG_NOT_AVAILABLE',
                             'Dynamic config "{file}" is not available',
                             {'file': file})
    try:
        with open(local_file, 'r') as f:
            return json.load(f)
    except Exception:
        raise ScanariumError('SE_DYNAMIC_CONFIG_UNREADABLE',
                             'Dynamic config "{file}" cannot be read',
                             {'file': file})


def register_arguments(parser):
    parser.add_argument('FILE', help='Path of the file to dump')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments(
        'Dumps a config file',
        register_arguments,
        whitelisted_cgi_fields={'file': 1})

    scanarium.call_guarded(dump, args.FILE)
