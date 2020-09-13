#!/usr/bin/env python3

import cv2
import logging

from common import get_image

logger = logging.getLogger(__name__)


def show_source():
    key = -1
    while key == -1:
        image = get_image()
        title = 'Raw source (Press any key to quit)'
        cv2.imshow(title, image)
        key = cv2.waitKey(25)


if __name__ == "__main__":
    show_source()
