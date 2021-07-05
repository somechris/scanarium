# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
del sys.path[0]


from .environment import BasicTestCase


class ScanariumTest(BasicTestCase):
    def test_to_safe_filename_simple(self):
        actual = Scanarium().to_safe_filename('foo')
        self.assertEqual(actual, 'foo')

    def test_to_safe_filename_empty(self):
        actual = Scanarium().to_safe_filename('')
        self.assertEqual(actual, 'unnamed')

    def test_to_safe_filename_umlaut(self):
        actual = Scanarium().to_safe_filename('FäoöoüoÄoÖoÜoßo')
        self.assertEqual(actual, 'F-o-o-o-o-o-o-o')

    def test_to_safe_filename_eo(self):
        actual = Scanarium().to_safe_filename('FĝoĜo')
        self.assertEqual(actual, 'F-o-o')

    def test_to_safe_filename_multiple(self):
        actual = Scanarium().to_safe_filename('FäöüoÄÖÜo')
        self.assertEqual(actual, 'F-o-o')

    def test_to_safe_filename_start(self):
        actual = Scanarium().to_safe_filename('Äöquux')
        self.assertEqual(actual, 'quux')

    def test_to_safe_filename_end(self):
        actual = Scanarium().to_safe_filename('quuxßĵ')
        self.assertEqual(actual, 'quux')

    def test_to_safe_filename_digits(self):
        actual = Scanarium().to_safe_filename('F47o11o')
        self.assertEqual(actual, 'F47o11o')

    def test_to_safe_filename_punctuation(self):
        actual = Scanarium().to_safe_filename('F.o/,o')
        self.assertEqual(actual, 'F-o-o')
