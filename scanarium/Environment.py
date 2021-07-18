# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import argparse
import base64
import cgi
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
    def __init__(self, backend_dir_abs, config, dumper, util):
        super(Environment, self).__init__()
        self._backend_dir_abs = backend_dir_abs
        self._config = config
        self._dumper = dumper
        self._util = util
        self._cleanup_functions = set()
        self.set_signal_handlers()
        self.reset_method()

    def reset_method(self):
        try:
            del os.environ['SCANARIUM_METHOD']
        except KeyError:
            # The environment variable has not yet been set, so it's
            # reset already.
            pass

    def run(self, command, check=True, timeout=10, input=None):
        sep = "\" \""
        logger.debug(f'Running external command with check={check}, '
                     f'timeout={timeout}: "{sep.join(command)}"')
        try:
            process = subprocess.run(
                command, check=check, timeout=timeout, input=input,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                universal_newlines=True)
        except subprocess.TimeoutExpired as e:
            raise ScanariumError(
                'SE_TIMEOUT', 'The command "{command}" did not finish within '
                '{timeout} seconds',
                {'command': str(command), timeout: timeout},
                private_parameters={
                    'stdout': e.stdout,
                    'stderr': e.stderr,
                })
        except subprocess.CalledProcessError as e:
            raise ScanariumError(
                'SE_RETURN_VALUE', 'The command "{command}" did not return 0',
                {'command': str(command)},
                private_parameters={
                    'stdout': e.stdout,
                    'stderr': e.stderr,
                })

        return {
            'stdout': process.stdout,
            'stderr': process.stderr,
        }

    def _set_display(self):
        if IS_CGI:
            display = self._config.get('cgi', 'display', allow_empty=True,
                                       allow_missing=True)
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
        self.reset_method()
        if self._config.get('log', 'cgi_date', kind='boolean'):
            try:
                now = self._util.get_timestamp()
                formatted_now = now.strftime('%Y-%m-%dT00:00:00Z')
                log_filename = self._util.get_log_filename(
                    'last-cgi-call-date.txt', timestamped=False)
                self._dumper.dump_text(log_filename, formatted_now)
            except Exception:
                # Logging failed. There's not much we can do here.
                pass

        exc_info = None
        try:
            caller = self.normalized_caller(-2)

            if not re.match(r'^[a-zA-Z-]*$', caller) and check_caller:
                raise ScanariumError('SE_CGI_NAME_CHARS',
                                     'Forbidden characters in cgi name')

            os.environ['SCANARIUM_METHOD'] = caller

            if IS_CGI:
                if not self._config.get('cgi:%s' % caller, 'allow', 'boolean'):
                    raise ScanariumError('SE_CGI_FORBIDDEN',
                                         'Calling script "{script_name}" as '
                                         'cgi is forbidden',
                                         {'script_name': caller})

            self._set_display()

            payload = func(func_self, *args, **kwargs)
        except:  # noqa: E722
            payload = 'Failed'
            exc_info = sys.exc_info()

        self._result(payload=payload, exc_info=exc_info)

    def _result(self, payload={}, exc_info=None):
        if isinstance(payload, Result):
            if exc_info is None:
                result = payload
            else:
                result = Result(payload.as_dict(), exc_info)
        else:
            result = Result(payload, exc_info)

        if IS_CGI:
            ret = result.as_dict()
        else:
            if exc_info is not None or not result.is_ok:
                if exc_info is not None and \
                        self._config.get('general', 'debug', 'boolean'):
                    traceback.print_exception(*exc_info)
                print('ERROR: %s' % result.error_code)
                print(result.error_message)
                print()
            ret = result.payload

        print(self._dumper.dump_json_string(ret))

        if self._config.get('log', 'cgi_results', kind='boolean'):
            try:
                log_filename = self._util.get_log_filename('cgi-result.json')
                self._dumper.dump_json(log_filename, ret)
            except Exception:
                # Logging failed. There's not much we can do here.
                pass

        self.cleanup(exit_code=0)

    def _inject_cgi_arguments(self, fields):
        parameters = cgi.FieldStorage()

        arguments = ['']
        for source, target in fields.items():
            value = parameters.getfirst(source, '')

            if isinstance(value, bytes):
                value = base64.standard_b64encode(value).decode()

            if len(arguments) <= target:
                arguments += [''] * (target - len(arguments) + 1)
            arguments[target] = value

        sys.argv += arguments[1:]

    def handle_arguments(self, scanarium, description, register_func=None,
                         whitelisted_cgi_fields={}):
        if IS_CGI:
            try:
                self._inject_cgi_arguments(whitelisted_cgi_fields)
            except Exception:
                logging.getLogger().exception('Parsing CGI arguments')

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
