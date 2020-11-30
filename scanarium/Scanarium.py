import logging
import os
import scanarium


logger = logging.getLogger(__name__)


class Scanarium(object):
    def __init__(self):
        super(Scanarium, self).__init__()
        self._config = scanarium.Config(self.get_config_dir_abs())
        self._dumper = scanarium.Dumper()
        self._environment = scanarium.Environment(
            self.get_backend_dir_abs(), self._config, self._dumper)
        self._indexer = scanarium.Indexer(self.get_dynamic_directory(),
                                          self._dumper)
        self._scanner = scanarium.Scanner(self._config)

    def get_config(self, section=None, key=None, kind='string',
                   allow_empty=False):
        return self._config.get(section, key, kind, allow_empty)

    def get_scanarium_dir_abs(self):
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def get_relative_dir_abs(self, relative_dir):
        return os.path.join(self.get_scanarium_dir_abs(), relative_dir)

    def get_config_dir_abs(self):
        return self.get_relative_dir_abs('conf')

    def get_backend_dir_abs(self):
        return self.get_relative_dir_abs('backend')

    def get_frontend_dir_abs(self):
        return self.get_relative_dir_abs('frontend')

    def get_frontend_dynamic_dir_abs(self):
        return os.path.join(self.get_frontend_dir_abs(), 'dynamic')

    def get_frontend_cgi_bin_dir_abs(self):
        return os.path.join(self.get_frontend_dir_abs(), 'cgi-bin')

    def get_scenes_dir_abs(self):
        return self.get_relative_dir_abs('scenes')

    def get_dynamic_directory(self):
        dyn_dir = self.get_config('directories', 'dynamic')
        if not os.path.isabs(dyn_dir):
            dyn_dir = os.path.join(self.get_scanarium_dir_abs(), dyn_dir)
        return dyn_dir

    def reindex_actors_for_scene(self, scene):
        self._indexer.reindex_actors_for_scene(scene)

    def debug_show_image(self, title, image):
        self._scanner.debug_show_image(title, image)

    def open_camera(self):
        return self._scanner.open_camera()

    def close_camera(self, camera):
        return self._scanner.close_camera(camera)

    def get_image(self, camera=None):
        return self._scanner.get_image(camera)

    def extract_qr(self, image):
        return self._scanner.extract_qr(image)

    def process_image_with_qr_code(self, image, qr_rect, scene, actor):
        return self._scanner.process_image_with_qr_code(
            self, image, qr_rect, scene, actor)

    def rectify_to_biggest_rect(self, image):
        return self._scanner.rectify_to_biggest_rect(scanarium, image)

    def run(self, command, check=True, timeout=10):
        return self._environment.run(command, check, timeout)

    def call_guarded(self, func, *args, **kwargs):
        return self._environment.call_guarded(self, func, *args, **kwargs)

    def handle_arguments(self, description, register_func=None):
        return self._environment.handle_arguments(description, register_func)
