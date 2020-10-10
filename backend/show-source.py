#!/usr/bin/env python3

import logging
import os
import sys

import cv2

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import Scanarium
del sys.path[0]

logger = logging.getLogger(__name__)


def show_source(scanarium):
    key = -1
    while key == -1:
        image = scanarium.get_image()
        title = 'Raw source (Press any key to quit)'
        cv2.imshow(title, image)
        key = cv2.waitKey(25)


if __name__ == "__main__":
    Scanarium().call_guarded(show_source)
