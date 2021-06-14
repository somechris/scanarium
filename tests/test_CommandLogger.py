# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import CommandLogger, ScanariumError
del sys.path[0]


from .environment import BasicTestCase


class FakeDumper():
    def __init__(self):
        self.dumps = 0
        self.last_file = None
        self.last_data = None

    def dump_json(self, file, data):
        self.dumps += 1
        self.last_file = file
        self.last_data = data


class CommandLoggerTest(BasicTestCase):
    def run_dump(self, contents=None, payload={}, exc_info=None, command=None,
                 parameters=[]):
        dumper = FakeDumper()
        with self.prepared_environment() as dir:
            log_file = os.path.join(dir, 'command-log.json')
            if contents is not None:
                self.setFile(log_file, contents=contents)
            command_logger = CommandLogger(dir, dumper)
            command_logger.log(
                payload=payload, exc_info=exc_info, command=command,
                parameters=parameters)
        self.assertEqual(dumper.dumps, 1)
        self.assertEqual(dumper.last_file, log_file)
        return dumper.last_data

    def test_dump_simple_no_file(self):
        dumped = self.run_dump(
            payload='foo',
            exc_info=(None, ScanariumError(
                    'QUUX', 'QUUUX {xyz}', {'xyz': 'abc'})),
            command='bar',
            parameters=['baz'])
        entry = dumped[0]
        self.assertEqual(entry['command'], 'bar')
        self.assertEqual(entry['parameters'], ['baz'])
        self.assertEqual(entry['payload'], 'foo')
        self.assertEqual(entry['error_code'], 'QUUX')
        self.assertEqual(entry['error_message'], 'QUUUX abc')
        self.assertEqual(entry['error_template'], 'QUUUX {xyz}')
        self.assertEqual(entry['error_parameters'], {'xyz': 'abc'})
        self.assertLenIs(dumped, 1)

    def test_dump_simple_empty_file(self):
        dumped = self.run_dump(contents='', command='bar',)
        entry = dumped[0]
        self.assertEqual(entry['command'], 'bar')
        self.assertLenIs(dumped, 1)

    def test_dump_simple_invalid_json_file(self):
        dumped = self.run_dump(contents='X', command='bar')
        entry = dumped[0]
        self.assertEqual(entry['command'], 'bar')
        self.assertLenIs(dumped, 1)

    def test_dump_simple_empty_json_list_file(self):
        dumped = self.run_dump(contents='[]', command='bar')
        entry = dumped[0]
        self.assertEqual(entry['command'], 'bar')
        self.assertLenIs(dumped, 1)

    def test_dump_simple_1_old_entry(self):
        dumped = self.run_dump(contents='["foo"]', command='bar')
        entry = dumped[0]
        self.assertEqual(entry['command'], 'bar')
        self.assertLenIs(dumped, 1)
