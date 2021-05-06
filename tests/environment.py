import unittest
import configparser
import json
import os
import shutil
import subprocess
import tempfile

FIXTURE_DIR = os.path.join('tests', 'fixtures')


class NotCleanedUpTemporaryDirectory(object):
    def __init__(self, prefix):
        self.name = tempfile.mkdtemp(prefix=prefix)

    def __enter__(self):
        return self.name

    def __exit__(self, exc, value, tb):
        pass


class CanaryTestCase(unittest.TestCase):
    def add_fixture(self, name, dir):
        src = os.path.join(FIXTURE_DIR, name)
        dest = os.path.join(dir, name)
        if os.path.isdir(src):
            shutil.copytree(src, dest)
        else:
            shutil.copy(src, dest)

    def prepared_environment(self, name=None, cleanup=True):
        temp_dir_cls = tempfile.TemporaryDirectory if cleanup \
            else NotCleanedUpTemporaryDirectory
        ctx = temp_dir_cls(prefix='scanarium-test-')
        dir = ctx.name

        dynamic_dir = os.path.join(dir, 'dynamic')

        if name:
            self.add_fixture(name, ctx.name)

        overrides = {
            'directories': {
                'dynamic': dynamic_dir,
            },
            'scan': {
                'source': '/dev/null',
                'max_raw_width': 1000,
                'max_raw_height': 1000,
                'max_final_width': 1000,
                'max_final_height': 1000,
                'permit_file_type_heic': True,
            },
        }

        config = configparser.ConfigParser()
        for section, options in overrides.items():
            config[section] = options

        with open(os.path.join(dir, 'override.conf'), 'w') as configfile:
            config.write(configfile)

        return ctx

    def run_command(self, command):
        process = subprocess.run(command,
                                 check=True,
                                 timeout=3,
                                 stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE,
                                 universal_newlines=True)
        return {
            'stdout': process.stdout,
            'stderr': process.stderr,
        }

    def run_cgi(self, dir, cgi, arguments=[]):
        cgi_file = os.path.join('.', 'backend', f'{cgi}.py')

        standard_arguments = [
            '--debug-config-override', os.path.join(dir, 'override.conf')
        ]

        command = [cgi_file] + standard_arguments + arguments

        return self.run_command(command)

    def flatten(self, x):
        ret = []
        if isinstance(x, list):
            for element in x:
                ret += self.flatten(element)
        else:
            ret = [x]
        return ret

    def setFile(self, file_name, contents='', mtime=None):
        flat_file_name = os.path.join(*self.flatten(file_name))
        os.makedirs(os.path.dirname(flat_file_name), exist_ok=True)
        with open(flat_file_name, 'w') as file:
            file.write(contents)
        if mtime is not None:
            os.utime(flat_file_name, (mtime, mtime))

    def get_file_contents(self, file_name):
        flat_file_name = os.path.join(*self.flatten(file_name))
        with open(flat_file_name, 'rt') as file:
            contents = file.read()
        return contents

    def assertFileContents(self, file_name, expected):
        actual = json.loads(self.get_file_contents(file_name))
        self.assertEqual(actual, expected)
