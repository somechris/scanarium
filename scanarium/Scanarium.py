# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import os
import scanarium


logger = logging.getLogger(__name__)


class Scanarium(object):
    def __init__(self):
        super(Scanarium, self).__init__()
        self._config = scanarium.Config(self.get_config_dir_abs())
        self._dumper = scanarium.Dumper()
        self._localizer_factory = scanarium.LocalizerFactory(
            self.get_localization_dir_abs())
        self._command_logger = scanarium.CommandLogger(
            self.get_dynamic_directory(), self._dumper)
        self._util = scanarium.Util(self)
        self._environment = scanarium.Environment(
            self.get_backend_dir_abs(), self._config, self._dumper, self._util)
        self._indexer = scanarium.Indexer(self.get_dynamic_directory(),
                                          self._dumper)
        self._resetter = scanarium.Resetter(
            self.get_dynamic_directory(),
            self.get_dynamic_sample_dir_abs(),
            self._indexer, self._command_logger)
        self._scanner = scanarium.Scanner(self._config, self._command_logger)

    def get_config(self, section=None, key=None, kind='string',
                   allow_empty=False, allow_missing=False, default=None):
        return self._config.get(section, key, kind, allow_empty,
                                allow_missing, default)

    def set_config(self, section, key, value):
        self._config.set(section, key, value)

    def get_config_keys(self, section):
        return self._config.get_keys(section)

    def get_scanarium_dir_abs(self):
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def get_relative_dir_abs(self, relative_dir):
        return os.path.join(self.get_scanarium_dir_abs(), relative_dir)

    def get_config_dir_abs(self):
        return self.get_relative_dir_abs('conf')

    def get_backend_dir_abs(self):
        return self.get_relative_dir_abs('backend')

    def get_commands_dir_abs(self):
        return self.get_relative_dir_abs('commands')

    def get_frontend_dir_abs(self):
        return self.get_relative_dir_abs('frontend')

    def get_frontend_dynamic_dir_abs(self):
        return os.path.join(self.get_frontend_dir_abs(), 'dynamic')

    def get_frontend_cgi_bin_dir_abs(self):
        return os.path.join(self.get_frontend_dir_abs(), 'cgi-bin')

    def get_localization_dir_abs(self):
        return self.get_relative_dir_abs('localization')

    def get_scenes_dir_abs(self):
        return self.get_relative_dir_abs('scenes')

    def get_directory_from_config(self, key):
        dir = self.get_config('directories', key)
        if not os.path.isabs(dir):
            dir = os.path.join(self.get_scanarium_dir_abs(), dir)
        return dir

    def get_dynamic_directory(self):
        return self.get_directory_from_config('dynamic')

    def get_dynamic_sample_dir_abs(self):
        return self.get_relative_dir_abs('dynamic.sample')

    def get_images_dir_abs(self):
        return self.get_relative_dir_abs('images')

    def get_log_dir_abs(self):
        return self.get_directory_from_config('log')

    def reindex_actors_for_scene(self, scene):
        self._indexer.reindex_actors_for_scene(scene)

    def reset_dynamic_content(self, log=True):
        return self._resetter.reset_dynamic_content(log)

    def get_localizer(self, language):
        return self._localizer_factory.get_localizer(language)

    def dump_json(self, file, data):
        self._dumper.dump_json(file, data)

    def dump_text(self, file, data):
        self._dumper.dump_text(file, data)

    def debug_show_image(self, title, image):
        self._scanner.debug_show_image(title, image)

    def open_camera(self):
        return self._scanner.open_camera()

    def close_camera(self, camera):
        return self._scanner.close_camera(camera)

    def get_image(self, camera=None):
        return self._scanner.get_image(self, camera)

    def get_brightness_factor(self):
        # We cache the image to avoid having to costly reload it for each
        # processed frame.
        try:
            ret = self._brightness_factor
        except AttributeError:
            ret = self._scanner.get_brightness_factor(self)
            self._brightness_factor = ret

        return ret

    def extract_qr(self, image):
        return self._scanner.extract_qr(image)

    def actor_image_pipeline(self, image, qr_rect, scene, actor,
                             visualized_alpha=None):
        return self._scanner.actor_image_pipeline(
            self, image, qr_rect, scene, actor,
            visualized_alpha=visualized_alpha)

    def process_image_with_qr_code(self, image, qr_rect, data,
                                   should_skip_exception=None):
        return self._scanner.process_image_with_qr_code(
            self, image, qr_rect, data, should_skip_exception)

    def rectify_to_biggest_rect(self, image, yield_only_points=False):
        return self._scanner.rectify_to_biggest_rect(
            self, image, yield_only_points=yield_only_points)

    def rectify_to_qr_parent_rect(self, image, qr_rect,
                                  yield_only_points=False):
        return self._scanner.rectify_to_qr_parent_rect(
            self, image, qr_rect, yield_only_points=yield_only_points)

    def run(self, command, check=True, timeout=10, input=None):
        return self._environment.run(command, check, timeout, input)

    def call_guarded(self, func, *args, check_caller=True, **kwargs):
        return self._environment.call_guarded(
            self, func, *args, check_caller=check_caller, **kwargs)

    def handle_arguments(self, description, register_func=None,
                         whitelisted_cgi_fields={}):
        return self._environment.handle_arguments(
            self, description, register_func, whitelisted_cgi_fields)

    def register_for_cleanup(self, f):
        self._environment.register_for_cleanup(f)

    def unregister_for_cleanup(self, f):
        self._environment.unregister_for_cleanup(f)

    def generate_thumbnail(self, dir, file, force=False, level=[]):
        self._util.generate_thumbnail(self, dir, file, force, level)

    def file_needs_update(self, destination, sources, force=False):
        return self._util.file_needs_update(destination, sources, force)

    def get_log_filename(self, name):
        return self._util.get_log_filename(name)

    def guess_image_format(self, file_path):
        return self._util.guess_image_format(file_path)

    def to_safe_filename(self, name):
        return self._util.to_safe_filename(name)

    def embed_metadata(self, filename, metadata):
        return self._util.embed_metadata(self, filename, metadata)

    def get_now(self):
        return self._util.get_now()

    def get_timestamp_for_filename(self):
        return self._util.get_timestamp_for_filename()

    def get_command_logger(self):
        return self._command_logger
