import configparser
import os


class Config(object):
    def __init__(self, config_dir_abs):
        super(Config, self).__init__()
        self._load_config(config_dir_abs)

    def _load_config(self, config_dir_abs):
        config = configparser.ConfigParser()

        config.read(os.path.join(config_dir_abs, 'scanarium.conf.defaults'))

        config_file_abs = os.path.join(config_dir_abs, 'scanarium.conf')
        if os.path.isfile(config_file_abs):
            config.read(config_file_abs)

        self._config = config

    def get(self, section, key, kind='string', allow_empty=False):
        if allow_empty and self._config.get(section, key) == '':
            return None
        if kind == 'string':
            func = self._config.get
        elif kind == 'boolean':
            func = self._config.getboolean
        elif kind == 'int':
            func = self._config.getint
        elif kind == 'float':
            func = self._config.getfloat
        else:
            raise RuntimeError('Unknown config value type "%s"' % (kind))
        return func(section, key)

    def set(self, section, key, value):
        self._config.set(section, key, value)
