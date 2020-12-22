#!/usr/bin/env python3

import concurrent.futures
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

SERVER_VERSION_OVERRIDE = None
THREAD_POOL_SIZE = max(2, len(os.sched_getaffinity(0)) - 2)


class RequestHandler(http.server.CGIHTTPRequestHandler):
    """Simple HTTP handler that aliases user-generated-content"""
    cgi_directories = ['/cgi-bin']

    def version_string(self):
        ret = SERVER_VERSION_OVERRIDE
        if ret is None:
            ret = super().version_string()
        return ret

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
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=THREAD_POOL_SIZE)

    def process_request(self, request, client_address):
        self.pool.submit(self.process_request_thread, request, client_address)


class ThreadPoolHTTPServer(ThreadPoolMixIn, http.server.HTTPServer):
    pass


def serve_forever(port):
    # Python <=3.6 does not allow to configure the directory to serve from,
    # but unconditionally servers from the current directory. As Linux Mint
    # Tricia is still on Python 3.6 and we do not want to exclude such users,
    # we instead chdir to the expected directory.
    os.chdir(scanarium.get_frontend_dir_abs())

    with ThreadPoolHTTPServer(('', port), RequestHandler) as httpd:
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


def register_arguments(parser):
    parser.add_argument('port', metavar='PORT', type=int, nargs='?',
                        help='The port to listen for connections on',
                        default=scanarium.get_config('demo_server', 'port'))
    parser.add_argument('--server-version-override', metavar='VERSION',
                        help='Override for response\'s `Server` header field',
                        default=None)


if __name__ == '__main__':
    args = scanarium.handle_arguments('Scanarium demo server',
                                      register_arguments)

    SERVER_VERSION_OVERRIDE = args.server_version_override

    serve_forever(args.port)
