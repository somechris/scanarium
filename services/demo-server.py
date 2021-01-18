#!/usr/bin/env python3

import concurrent.futures
import http
import http.server
import os
import socketserver
import sys
import logging

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
del sys.path[0]

scanarium = Scanarium()
logger = logging.getLogger(__name__)

LOG_REQUESTS = False
SERVER_VERSION_OVERRIDE = None


class RequestHandler(http.server.CGIHTTPRequestHandler):
    """Simple HTTP handler that aliases user-generated-content"""
    cgi_directories = ['/cgi-bin']

    def version_string(self):
        ret = SERVER_VERSION_OVERRIDE
        if ret is None:
            ret = super().version_string()
        return ret

    def log_request(self, code='-', size='-'):
        log = False
        if LOG_REQUESTS == 'all':
            log = True
        elif LOG_REQUESTS == 'non-200':
            log = code != 200
        elif LOG_REQUESTS == 'non-2xx':
            log = code < 200 or code >= 300
        elif LOG_REQUESTS == 'none':
            log = False
        else:
            raise RuntimeError('Unknown log setting "%s"' % (LOG_REQUESTS))

        if log:
            super(RequestHandler, self).log_request(code, size)

    def send_response(self, code, message=None):
        super(RequestHandler, self).send_response(code, message)
        self.send_header('Cache-Control', 'no-store')

    def run_cgi(self):
        # Shimming in server properties that we seem to be missing on Python
        # 3.8, although the Handler requires them. We're probably
        # instantiating the server wrong, but as it's only a demo server and
        # it works, it's good enough for now.
        self.server.server_name = ''
        self.server.server_port = 0

        return super().run_cgi()

    def translate_path(self, path):
        f = super().translate_path(path)
        dir = scanarium.get_frontend_dynamic_dir_abs() + os.sep
        if f.startswith(dir):
            f = f[len(dir):]
            f = os.path.join(scanarium.get_dynamic_directory(), f)
            f = os.path.normpath(f)
        dir = scanarium.get_frontend_cgi_bin_dir_abs() + os.sep
        if f.startswith(dir):
            f = f[len(dir):]
            f = os.path.join(scanarium.get_backend_dir_abs(), f)
            if not f.endswith('.py'):
                f += '.py'
            f = os.path.normpath(f)
        return f


class ThreadPoolMixIn(socketserver.ThreadingMixIn):
    def init_thread_pool(self, size):
        self.pool = concurrent.futures.ThreadPoolExecutor(max_workers=size)

    def process_request(self, request, client_address):
        self.pool.submit(self.process_request_thread, request, client_address)


class ThreadPoolHTTPServer(ThreadPoolMixIn, http.server.HTTPServer):
    pass


def serve_forever(port, thread_pool_size):
    # Python <=3.6 does not allow to configure the directory to serve from,
    # but unconditionally servers from the current directory. As Linux Mint
    # Tricia is still on Python 3.6 and we do not want to exclude such users,
    # we instead chdir to the expected directory.
    os.chdir(scanarium.get_frontend_dir_abs())

    with ThreadPoolHTTPServer(('', port), RequestHandler) as httpd:
        httpd.init_thread_pool(thread_pool_size)

        print('-------------------------------------------------------------')
        print()
        print('Scanarium demo server listening on port', port)
        print()
        print('To use Scanarium, yoint your browser to the following URL:')
        print()
        print('  http://localhost:%d/' % (port))
        print()
        print('Note that this demo server is not secure. Please consider')
        print('to instead run it on a proper webserver like Apache HTTPD.')
        print()
        print('-------------------------------------------------------------')
        print()
        sys.stdout.flush()

        httpd.serve_forever()


def register_arguments(scanarium, parser):
    def get_conf(key, kind='string', allow_empty=False):
        return scanarium.get_config('service:demo-server', key, kind=kind,
                                    allow_empty=allow_empty)

    parser.add_argument('port', metavar='PORT', type=int, nargs='?',
                        help='The port to listen for connections on',
                        default=get_conf('port'))
    parser.add_argument('--log-requests', metavar='KIND',
                        help='The kind of requests to log. Either `all` to '
                        'log all requests, `non-200` to log all requests that '
                        'have a response status different to 200, `non-2xx` '
                        'to log all requests that are outside of the '
                        '`success` range, or `none` to log no requests at '
                        ' all.',
                        choices=['all', 'non-200', 'non-2xx', 'none'],
                        default=get_conf('log_requests'))
    parser.add_argument('--server-version-override', metavar='VERSION',
                        help='Override for response\'s `Server` header field',
                        default=get_conf('server_version_override',
                                         allow_empty=True))
    parser.add_argument('--thread-pool-size', metavar='THREADS', type=int,
                        help='Number of threads to serve requests from',
                        default=get_conf('thread_pool_size', kind='int'))


if __name__ == '__main__':
    args = scanarium.handle_arguments('Scanarium demo server',
                                      register_arguments)

    SERVER_VERSION_OVERRIDE = args.server_version_override
    LOG_REQUESTS = args.log_requests

    serve_forever(args.port, args.thread_pool_size)
