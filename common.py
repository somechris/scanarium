import argparse
import locale
import logging
import os
import subprocess
import re
import sys
import traceback
import scanarium

from scanarium import ScanariumError

locale.resetlocale()

IS_CGI = 'REMOTE_ADDR' in os.environ
if IS_CGI:
    print('Content-Type: application/json')
    print()

LOG_FORMAT = ('%(asctime)s.%(msecs)03d %(levelname)-5s [%(threadName)s] '
              '%(filename)s:%(lineno)d - %(message)s')
LOG_DATE_FORMAT = '%Y-%m-%dT%H:%M:%S'

logging.basicConfig(format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
logger = logging.getLogger(__name__)


class Scanarium(object):
    def __init__(self):
        super(Scanarium, self).__init__()
        self._config = scanarium.Config(self.get_config_dir_abs())
        self._dumper = scanarium.Dumper()
        self._indexer = scanarium.Indexer(self.get_dynamic_directory(),
                                          self._dumper)
        self._scanner = scanarium.Scanner(self._config)

    def get_config(self, section=None, key=None, kind='string',
                   allow_empty=False):
        return self._config.get(section, key, kind, allow_empty)

    def get_scanarium_dir_abs(self):
        return os.path.dirname(os.path.abspath(__file__))

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

    def get_image(self):
        return self._scanner.get_image()

    def run(self, command, check=True, timeout=10):
        try:
            process = subprocess.run(
                command, check=check, timeout=timeout, stdout=subprocess.PIPE,
                universal_newlines=True)
        except subprocess.TimeoutExpired:
            raise ScanariumError('SE_TIMEOUT', 'The command "%s" did not '
                                 'finish within %d seconds' % (str(command),
                                                               timeout))
        except subprocess.CalledProcessError:
            raise ScanariumError('SE_RETURN_VALUE', 'The command "%s" did '
                                 'not return 0' % (str(command)))
        return process.stdout

    def set_display(self):
        if IS_CGI:
            display = self.get_config('cgi', 'display')
            if display:
                os.environ['DISPLAY'] = display

    def call_guarded(self, func, *args, **kwargs):
        try:
            caller = traceback.extract_stack()[-2].filename
            if not os.path.isabs(caller):
                caller = os.path.join(os.getcwd(), caller)
            caller = os.path.normpath(caller)
            start = self.get_backend_dir_abs() + os.sep
            if caller.startswith(start):
                caller = caller[len(start):]
            if caller.endswith('.py'):
                caller = caller[:-3]

            if not re.match(r'^[a-zA-Z-]*$', caller):
                raise ScanariumError('SE_CGI_NAME_CHARS',
                                     'Forbidden characters in cgi name')

            if IS_CGI:
                if not self.get_config('cgi:%s' % caller, 'allow', 'boolean'):
                    raise ScanariumError('SE_CGI_FORBIDDEN',
                                         'Calling script as cgi is forbidden')

            self.set_display()

            payload = func(self, *args, **kwargs)
        except:  # noqa: E722
            self.result(payload='Failed', exc_info=sys.exc_info())

        self.result(payload=payload)

    def result(self, payload={}, exc_info=None):
        if exc_info is None:
            error_code = None
            error_message = None
        else:
            if self.get_config('general', 'debug', 'boolean'):
                traceback.print_exception(*exc_info)
            if isinstance(exc_info[1], ScanariumError):
                error_code = exc_info[1].code
                error_message = exc_info[1].message
            else:
                error_code = 'SE_UNDEF'
                error_message = 'undefined error'
        if IS_CGI:
            capsule = {
                'payload': payload,
                'is_ok': exc_info is None,
                'error_code': error_code,
                'error_message': error_message,
            }
            print(self._dumper.dump_json_string(capsule))
        else:
            if exc_info is not None:
                print('ERROR: %s' % error_code)
                print(error_message)
                print()
            if payload:
                print(self._dumper.dump_json_string(payload))
        sys.exit(0)

    def handle_arguments(self, description, register_func=None):
        parser = argparse.ArgumentParser(
            description=description,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument('--verbose', '-v', action='count', default=0,
                            help='Increase verbosity')

        if register_func is not None:
            register_func(parser)

        args = parser.parse_args()

        if args.verbose > 0:
            logging.getLogger().setLevel(logging.DEBUG)

        return args
