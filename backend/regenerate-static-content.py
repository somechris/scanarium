#!/usr/bin/env python3

import os
import logging
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import SCANARIUM_CONFIG
from common import SCENES_DIR_ABS
from common import call_guarded
from common import run
del sys.path[0]

logger = logging.getLogger(__name__)


def get_thumbnail_name(dir, file):
    basename = file.rsplit('.', 1)[0]
    return os.path.join(dir, basename + '-thumb.jpg')


def generate_thumbnail(dir, file, shave=True, erode=False):
    source = os.path.join(dir, file)
    target = get_thumbnail_name(dir, file)
    command = [SCANARIUM_CONFIG['programs']['convert'], source]
    if shave:
        command += ['-shave', '20%']
    if erode:
        command += ['-morphology', 'Erode', 'Octagon']
    command += ['-resize', '150x100', target]
    run(command)


def generate_pdf(dir, file):
    source = os.path.join(dir, file)
    target = os.path.join(dir, file.rsplit('.', 1)[0] + '.pdf')
    command = [
        SCANARIUM_CONFIG['programs']['inkscape'],
        '--export-area-page',
        '--export-pdf=%s' % (target),
        source,
    ]

    run(command)


def regenerate_actor(actor_dir, actor):
    generate_thumbnail(actor_dir, actor + '.svg', shave=False, erode=True)
    generate_pdf(actor_dir, actor + '.svg')


def regenerate_actors(scene_dir):
    actors_dir = os.path.join(scene_dir, 'actors')
    if os.path.isdir(actors_dir):
        for actor in os.listdir(actors_dir):
            actor_dir = os.path.join(actors_dir, actor)
            if os.path.isdir(actor_dir):
                regenerate_actor(actor_dir, actor)


def regenerate():
    scenes_dir = SCENES_DIR_ABS
    if os.path.isdir(scenes_dir):
        for scene in os.listdir(scenes_dir):
            scene_dir = os.path.join(scenes_dir, scene)
            if os.path.isdir(scene_dir):
                regenerate_actors(scene_dir)


if __name__ == "__main__":
    call_guarded(regenerate)
