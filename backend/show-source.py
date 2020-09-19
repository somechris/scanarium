#!/usr/bin/env python3

import logging
import os
import sys

import cv2

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import call_guarded
from common import get_image
del sys.path[0]

logger = logging.getLogger(__name__)


def show_source():
    key = -1
    while key == -1:
        image = get_image()
        title = 'Raw source (Press any key to quit)'
        cv2.imshow(title, image)
        key = cv2.waitKey(25)


if __name__ == "__main__":
    call_guarded(show_source)
