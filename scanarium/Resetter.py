import logging
import os
import shutil

logger = logging.getLogger(__name__)


class Resetter(object):
    def __init__(self, dynamic_dir_abs, dynamic_sample_dir_abs, indexer):
        super(Resetter, self).__init__()
        self._dynamic_dir_abs = dynamic_dir_abs
        self._dynamic_sample_dir_abs = dynamic_sample_dir_abs
        self._indexer = indexer

    def reset_dynamic_content(self):
        scenes_dir_abs = os.path.join(self._dynamic_dir_abs, 'scenes')
        for scene in os.listdir(scenes_dir_abs):
            logging.debug(f'Resetting dynamic content for scene "{scene}" ...')
            scene_dir_abs = os.path.join(scenes_dir_abs, scene)
            if os.path.isdir(scene_dir_abs):
                actors_dir_abs = os.path.join(scene_dir_abs, 'actors')
                try:
                    if os.path.isdir(actors_dir_abs):
                        shutil.rmtree(actors_dir_abs)

                    sample_actors_dir_abs = os.path.join(
                        self._dynamic_sample_dir_abs, 'scenes', scene,
                        'actors')
                    if os.path.isdir(sample_actors_dir_abs):
                        shutil.copytree(sample_actors_dir_abs, actors_dir_abs)
                finally:
                    self._indexer.reindex_actors_for_scene(scene)
