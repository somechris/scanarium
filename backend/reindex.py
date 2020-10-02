#!/usr/bin/env python3

import os
import logging
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import SCENES_DIR_ABS
from common import call_guarded
from common import get_dynamic_directory
from common import reindex_actors_for_scene
del sys.path[0]

logger = logging.getLogger(__name__)


def reindex():
    dynamic_scenes_dir = os.path.join(get_dynamic_directory(), 'scenes')
    for scene in os.listdir(SCENES_DIR_ABS):
        if os.path.isdir(os.path.join(SCENES_DIR_ABS, scene)):
            dynamic_scene_dir = os.path.join(dynamic_scenes_dir, scene)
            if not os.path.isdir(dynamic_scene_dir):
                os.makedirs(dynamic_scene_dir)
            reindex_actors_for_scene(scene)


if __name__ == "__main__":
    call_guarded(reindex)
