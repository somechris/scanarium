#!/usr/bin/env python3

import logging
import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
from scanarium import ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def scan_actor_image(scanarium):
    image = scanarium.get_image()

    qr_rect = None
    scene = None
    actor = None
    iteration = 1
    while qr_rect is None:
        if iteration > 3:
            raise ScanariumError(
                'SE_SCAN_IMAGE_TOO_MANY_ITERATIONS',
                'Taken too many extraction tries from scanned image')

        if image.shape[1] < 150:
            # The image that we're homing in on is really small. It's unlikely
            # to be a proper A4 image, but rather the camera did not detect a
            # proper sheet rect and we're homing in on an (unrelated) small
            # rectangular part of the image. So we abort.
            raise ScanariumError('SE_SCAN_IMAGE_GREW_TOO_SMALL',
                                 'Failed to identify sheet on scanned image')
        try:
            (qr_rect, scene, actor) = scanarium.extract_qr(image)
        except ScanariumError as e:
            if e.code == 'SE_SCAN_NO_QR_CODE':
                # QR code could not get scanned. Probably, because the image
                # is too skew. We try to rectify on the images biggest rect
                # (probably the paper sheet). This should undistort the QR
                # code to be scanable in the next round.
                image = scanarium.rectify_to_biggest_rect(scanarium, image)
            else:
                raise e

        iteration += 1

    return scanarium.process_image_with_qr_code(image, qr_rect, scene, actor)


def main(scanarium):
    return scan_actor_image(scanarium)


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Scans an processes an image from the camera')
    scanarium.call_guarded(main)
