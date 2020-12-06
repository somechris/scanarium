#!/usr/bin/env python3

import os
import logging
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
del sys.path[0]

logger = logging.getLogger(__name__)


def reset_dynamic_content(scanarium):
    scanarium.reset_dynamic_content()


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Resets all dynamic content '
                               '(Deletes all scanned actors, ...)')
    scanarium.call_guarded(reset_dynamic_content)
