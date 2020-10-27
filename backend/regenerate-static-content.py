#!/usr/bin/env python3

import os
import logging
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import Scanarium, ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def assert_directory(dir):
    if not os.path.isdir(dir):
        raise ScanariumError('E_NO_DIR', 'Is not a directory "%s"' % dir)


def get_thumbnail_name(dir, file):
    basename = file.rsplit('.', 1)[0]
    return os.path.join(dir, basename + '-thumb.jpg')


def generate_thumbnail(scanarium, dir, file, shave=True, erode=False):
    source = os.path.join(dir, file)
    target = get_thumbnail_name(dir, file)
    command = [scanarium.get_config('programs', 'convert'), source]
    if shave:
        command += ['-shave', '20%']
    if erode:
        command += ['-morphology', 'Erode', 'Octagon']
    command += ['-resize', '150x100', target]
    scanarium.run(command)


def generate_pdf(scanarium, dir, file):
    source = os.path.join(dir, file)
    target = os.path.join(dir, file.rsplit('.', 1)[0] + '.pdf')
    command = [
        scanarium.get_config('programs', 'inkscape'),
        '--export-area-page',
        '--export-pdf=%s' % (target),
        source,
    ]

    scanarium.run(command)


def regenerate_static_content_actor(scanarium, scene, actor):
    logging.debug(
        f'Regenerating content for scene "{scene}", actor "{actor}" ...')
    scenes_dir = scanarium.get_scenes_dir_abs()
    actor_dir = os.path.join(scenes_dir, scene, 'actors', actor)
    assert_directory(actor_dir)
    generate_thumbnail(scanarium, actor_dir, actor + '.svg', shave=False,
                       erode=True)
    generate_pdf(scanarium, actor_dir, actor + '.svg')


def regenerate_static_content_scene(scanarium, scene):
    scenes_dir = scanarium.get_scenes_dir_abs()
    actors_dir = os.path.join(scenes_dir, scene, 'actors')

    assert_directory(actors_dir)

    for actor in os.listdir(actors_dir):
        regenerate_static_content_actor(scanarium, scene, actor)


def regenerate_static_content(scanarium):
    scenes_dir = scanarium.get_scenes_dir_abs()

    assert_directory(scenes_dir)

    for scene in os.listdir(scenes_dir):
        regenerate_static_content_scene(scanarium, scene)


if __name__ == "__main__":
    scanarium = Scanarium()
    scanarium.handle_arguments('Regenerates static content')
    scanarium.call_guarded(regenerate_static_content)
