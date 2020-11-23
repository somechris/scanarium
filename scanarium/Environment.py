import argparse
import locale
import logging
import os
import re
import subprocess
import sys
import traceback

from .ScanariumError import ScanariumError

IS_CGI = 'REMOTE_ADDR' in os.environ
LOG_FORMAT = ('%(asctime)s.%(msecs)03d %(levelname)-5s [%(threadName)s] '
              '%(filename)s:%(lineno)d - %(message)s')
LOG_DATE_FORMAT = '%Y-%m-%dT%H:%M:%S'


locale.resetlocale()
logging.basicConfig(format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
if IS_CGI:
    print('Content-Type: application/json')
    print()


class Environment(object):
    def __init__(self, backend_dir_abs, config, dumper):
        super(Environment, self).__init__()
        self._backend_dir_abs = backend_dir_abs
        self._config = config
        self._dumper = dumper

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

    def _set_display(self):
        if IS_CGI:
            display = self._config.get('cgi', 'display')
            if display:
                os.environ['DISPLAY'] = display

    def call_guarded(self, func_self, func, *args, **kwargs):
        try:
            caller = traceback.extract_stack()[-2].filename
            if not os.path.isabs(caller):
                caller = os.path.join(os.getcwd(), caller)
            if caller == os.path.join(os.getcwd(), 'scanarium',
                                      'Scanarium.py'):
                caller = traceback.extract_stack()[-3].filename
            if not os.path.isabs(caller):
                caller = os.path.join(os.getcwd(), caller)
            caller = os.path.normpath(caller)
            start = self._backend_dir_abs + os.sep
            if caller.startswith(start):
                caller = caller[len(start):]
            if caller.endswith('.py'):
                caller = caller[:-3]

            if not re.match(r'^[a-zA-Z-]*$', caller):
                raise ScanariumError('SE_CGI_NAME_CHARS',
                                     'Forbidden characters in cgi name')

            if IS_CGI:
                if not self._config.get('cgi:%s' % caller, 'allow', 'boolean'):
                    raise ScanariumError('SE_CGI_FORBIDDEN',
                                         'Calling script as cgi is forbidden')

            self._set_display()

            payload = func(func_self, *args, **kwargs)
        except:  # noqa: E722
            self._result(payload='Failed', exc_info=sys.exc_info())

        self._result(payload=payload)

    def _result(self, payload={}, exc_info=None):
        if exc_info is None:
            error_code = None
            error_message = None
        else:
            if self._config.get('general', 'debug', 'boolean'):
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
