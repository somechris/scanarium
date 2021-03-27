import json
import logging
import os

from .Localizer import Localizer

logger = logging.getLogger(__name__)


class LocalizerFactory(object):
    def __init__(self, localization_dir_abs):
        super(LocalizerFactory, self).__init__()
        self._localization_dir_abs = localization_dir_abs
        self._instances = {}

    def get_localizer(self, language=None):
        try:
            ret = self._instances[language]
        except KeyError:
            translations = {}

            if language is not None:
                json_file_abs = os.path.join(
                    self._localization_dir_abs, f'{language}.json')
                if os.path.isfile(json_file_abs):
                    with open(json_file_abs, 'r') as file:
                        translations = json.load(file)
            ret = Localizer(translations)
            self._instances[language] = ret

        return ret
