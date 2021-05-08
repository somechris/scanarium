import configparser
import os
import sys

from .ScanariumError import ScanariumError


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

        if len(sys.argv) >= 2 and sys.argv[1] == '--debug-config-override':
            if self.get('debug',
                        'enable_debug_config_override_command_line_argument',
                        kind='boolean'):
                if len(sys.argv) >= 3:
                    # Unconditionally loading the file. (Passing the parameter
                    # to a file that does not exist is a hard error)
                    override_file = sys.argv[2]
                    if os.path.isfile(override_file):
                        config.read(override_file)
                        config.read(override_file)
                        del sys.argv[2]
                        del sys.argv[1]
                    else:
                        raise ScanariumError(
                            'SE_OVERRIDE_FILE_DOES_NOT_EXIST',
                            'Override file `{override_file}` does not exist',
                            {'override_file': override_file})
                else:
                    raise ScanariumError(
                        'SE_ARGUMENT_ERROR',
                        'This program was called with '
                        '`--debug-config-override`, but no file with '
                        'overrides was specified')
            else:
                raise ScanariumError(
                    'SE_CONFIG_USED_BUT_FORBIDDEN',
                    'This program was called with `--debug-config-override`, '
                    'but the configuration at `debug.enable_debug_config_'
                    'override_command_line_argument` is not `True`.')

    def get(self, section, key, kind='string', allow_empty=False,
            allow_missing=False, default=None):
        try:
            if self._config.get(section, key) == '':
                if allow_empty:
                    return default
                else:
                    raise ScanariumError(
                        'SE_CONFIG_EMPTY',
                        'Empty configuration entry at "{key}" in "{section}"',
                        {'section': section, 'key': key})
        except (configparser.NoSectionError, configparser.NoOptionError):
            if allow_missing:
                return default
            raise ScanariumError(
                'SE_CONFIG_MISSING',
                'Missing configuration entry at "{key}" in "{section}"',
                {'section': section, 'key': key})
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

    def get_keys(self, section):
        return [pair[0] for pair in self._config.items(section)]
