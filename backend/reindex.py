#!/usr/bin/env python3

import os
import logging
import sys

SCANARIUM_DIR_ABS=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from common import get_dynamic_directory
from common import reindex_actors_for_scene
del sys.path[0]

logger = logging.getLogger(__name__)


def reindex():
    scenes_dir = os.path.join(get_dynamic_directory(), 'scenes')
    if os.path.isdir(scenes_dir):
        for scene in os.listdir(scenes_dir):
            scene_dir = os.path.join(scenes_dir, scene)
            if os.path.isdir(scene_dir):
                reindex_actors_for_scene(scene)


if __name__ == "__main__":
    reindex()
