# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import json
import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Dumper
del sys.path[0]


from .environment import BasicTestCase


class DumperTest(BasicTestCase):
    def assert_dumped_json(self, data):
        with self.prepared_environment() as dir:
            file = os.path.join(dir, 'dump')
            Dumper().dump_json(file, data)
            self.assertFileJsonContents(file, data)

    def assert_dumped_text(self, text):
        with self.prepared_environment() as dir:
            file = os.path.join(dir, 'dump')
            Dumper().dump_text(file, text)
            self.assertFileContents(file, text)

    def test_dump_json_string_None(self):
        self.assertEqual('null', Dumper().dump_json_string(None))

    def test_dump_json_string_string(self):
        self.assertEqual('"foo"', Dumper().dump_json_string('foo'))

    def test_dump_json_string_number(self):
        self.assertEqual('42', Dumper().dump_json_string(42))

    def test_dump_json_string_list(self):
        data = [1, 'foo']
        actual = json.loads(Dumper().dump_json_string(data))
        self.assertEqual(actual, data)

    def test_dump_json_string_dict(self):
        data = {
            'null': None,
            'string': 'foo',
            'number': 42,
            'list': [None, 'foo', 4711],
            'object': {
                'bar': 23,
                }
            }
        actual = json.loads(Dumper().dump_json_string(data))
        self.assertEqual(actual, data)

    def test_dump_json_file_None(self):
        self.assert_dumped_json(None)

    def test_dump_json_file_string(self):
        self.assert_dumped_json('foo')

    def test_dump_json_file_number(self):
        self.assert_dumped_json('foo')

    def test_dump_json_file_list(self):
        self.assert_dumped_json([1, 'foo'])

    def test_dump_json_file_dict(self):
        data = {
            'null': None,
            'string': 'foo',
            'number': 42,
            'list': [None, 'foo', 4711],
            'object': {
                'bar': 23,
                }
            }
        self.assert_dumped_json(data)

    def test_dump_text_empty(self):
        self.assert_dumped_text('')

    def test_dump_text_plain(self):
        self.assert_dumped_text('foo')

    def test_dump_text_multiline(self):
        self.assert_dumped_text('foo\nöÖß³')
