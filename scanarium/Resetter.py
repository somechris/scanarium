import logging
import os
import shutil
import sys

logger = logging.getLogger(__name__)


class Resetter(object):
    def __init__(self, dynamic_dir_abs, dynamic_sample_dir_abs, indexer,
                 command_logger):
        super(Resetter, self).__init__()
        self._dynamic_dir_abs = dynamic_dir_abs
        self._dynamic_sample_dir_abs = dynamic_sample_dir_abs
        self._indexer = indexer
        self._command_logger = command_logger

    def reset_dynamic_content_unlogged(self, scene):
        exc_info = None
        scenes_dir_abs = os.path.join(self._dynamic_dir_abs, 'scenes')
        for scene in ([scene] if scene else os.listdir(scenes_dir_abs)):
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
                except Exception:
                    if exc_info is None:
                        exc_info = sys.exc_info()
                finally:
                    self._indexer.reindex_actors_for_scene(scene)
        return exc_info

    def reset_dynamic_content(self, scene, log=True):
        ret = None
        exc_info = None
        try:
            exc_info = self.reset_dynamic_content_unlogged(scene)
        except Exception:
            exc_info = sys.exc_info()

        if log:
            ret = self._command_logger.log(
                None, exc_info, 'reset', ['DynamicContent'])
        else:
            if exc_info is not None:
                raise exc_info[1]

        return ret
