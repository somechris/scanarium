import argparse
import json
import locale
import logging
import os
import re
import signal
import subprocess
import sys
import traceback

from .ScanariumError import ScanariumError
from .Result import Result

IS_CGI = 'REMOTE_ADDR' in os.environ
LOG_FORMAT = ('%(asctime)s.%(msecs)03d %(levelname)-5s [%(threadName)s] '
              '%(filename)s:%(lineno)d - %(message)s')
LOG_DATE_FORMAT = '%Y-%m-%dT%H:%M:%S'


locale.resetlocale()
logging.basicConfig(format=LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
logger = logging.getLogger(__name__)

if IS_CGI:
    print('Content-Type: application/json')
    print()
    # If we're in a cgi, we weed out all arguments. Arguments are reserved for
    # local callers.
    sys.argv = sys.argv[0:1]


class Environment(object):
    def __init__(self, backend_dir_abs, config, dumper):
        super(Environment, self).__init__()
        self._backend_dir_abs = backend_dir_abs
        self._config = config
        self._dumper = dumper
        self._cleanup_functions = set()
        self.set_signal_handlers()

    def run(self, command, check=True, timeout=10):
        sep = "\" \""
        logger.debug(f'Running external command with check={check}, '
                     f'timeout={timeout}: "{sep.join(command)}"')
        try:
            process = subprocess.run(
                command, check=check, timeout=timeout, stdout=subprocess.PIPE,
                universal_newlines=True)
        except subprocess.TimeoutExpired:
            raise ScanariumError('SE_TIMEOUT', 'The command "{command}" did '
                                 'not finish within {timeout} seconds',
                                 {'command': str(command), timeout: timeout})
        except subprocess.CalledProcessError:
            raise ScanariumError('SE_RETURN_VALUE', 'The command "{command}" '
                                 'did not return 0', {'command': str(command)})
        return process.stdout

    def _set_display(self):
        if IS_CGI:
            display = self._config.get('cgi', 'display')
            if display:
                os.environ['DISPLAY'] = display

    def normalized_caller(self, idx, trim=True):
        caller = traceback.extract_stack()[idx].filename
        if not os.path.isabs(caller):
            caller = os.path.join(os.getcwd(), caller)
        caller = os.path.normpath(caller)
        package_dir_abs = os.path.dirname(os.path.abspath(__file__))
        if caller == os.path.join(package_dir_abs, 'Scanarium.py'):
            caller = self.normalized_caller(idx - 2, trim=False)
        if caller == os.path.join(package_dir_abs, 'Environment.py'):
            caller = self.normalized_caller(idx - 2, trim=False)
        start = self._backend_dir_abs + os.sep
        if caller.startswith(start):
            caller = caller[len(start):]
        if caller.endswith('.py'):
            caller = caller[:-3]
        return caller

    def call_guarded(self, func_self, func, *args, check_caller=True,
                     **kwargs):
        try:
            caller = self.normalized_caller(-2)

            if not re.match(r'^[a-zA-Z-]*$', caller) and check_caller:
                raise ScanariumError('SE_CGI_NAME_CHARS',
                                     'Forbidden characters in cgi name')

            if IS_CGI:
                if not self._config.get('cgi:%s' % caller, 'allow', 'boolean'):
                    raise ScanariumError('SE_CGI_FORBIDDEN',
                                         'Calling script "{script_name}" as '
                                         'cgi is forbidden',
                                         {'script_name': caller})

            self._set_display()

            payload = func(func_self, *args, **kwargs)
        except:  # noqa: E722
            self._result(payload='Failed', exc_info=sys.exc_info())

        self._result(payload=payload)

    def _result(self, payload={}, exc_info=None):
        if isinstance(payload, Result):
            if exc_info is None:
                result = payload
            else:
                result = Result(payload.as_dict(), exc_info)
        else:
            result = Result(payload, exc_info)
        if IS_CGI:
            print(self._dumper.dump_json_string(result.as_dict()))
        else:
            if exc_info is not None:
                if self._config.get('general', 'debug', 'boolean'):
                    traceback.print_exception(*exc_info)
                print('ERROR: %s' % result.error_code)
                print(result.error_message)
                print()
            print(self._dumper.dump_json_string(result.payload))
        self.cleanup(exit_code=0)

    def _extract_cgi_parameters(self):
        parameters = {}
        try:
            parameters = {}
            length = int(os.environ.get('CONTENT_LENGTH', 0))
            if length > 0:
                parameters_string = sys.stdin.read(length)
                parameters = json.loads(parameters_string)
        except Exception:
            logging.getLogger().exception('Parsing CGI arguments')

        return parameters

    def _inject_cgi_arguments(self, fields):
        parameters = self._extract_cgi_parameters()

        arguments = ['']
        for source, target in fields.items():
            value = parameters.get(source, '')
            if len(arguments) <= target:
                arguments += [''] * (target - len(arguments) + 1)
            arguments[target] = value

        sys.argv += arguments[1:]

    def handle_arguments(self, scanarium, description, register_func=None,
                         whitelisted_cgi_fields={}):
        if IS_CGI:
            self._inject_cgi_arguments(whitelisted_cgi_fields)

        parser = argparse.ArgumentParser(
            description=description,
            formatter_class=argparse.ArgumentDefaultsHelpFormatter)
        parser.add_argument('--verbose', '-v', action='count', default=0,
                            help='Increase verbosity')

        if register_func is not None:
            register_func(scanarium, parser)

        args = parser.parse_args()

        if args.verbose > 0:
            logging.getLogger().setLevel(logging.DEBUG)

        return args

    def cleanup(self, signum=0, frame=None, exit_code=143):
        while len(self._cleanup_functions):
            f = self._cleanup_functions.pop()
            try:
                f()
            except Exception:
                logging.getLogger().exception('Error while cleaning up')

        sys.exit(exit_code)

    def register_for_cleanup(self, f):
        self._cleanup_functions.add(f)

    def unregister_for_cleanup(self, f):
        try:
            self._cleanup_functions.remove(f)
        except KeyError:
            # The function was not in the set, so it has already been removed.
            # Hence, we pass.
            pass

    def set_signal_handlers(self):
        signal.signal(signal.SIGTERM, self.cleanup)
