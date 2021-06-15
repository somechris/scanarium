# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import FileLock, ScanariumError
del sys.path[0]


from .environment import BasicTestCase


class FileLockTest(BasicTestCase):
    def test_lock_success(self):
        with self.prepared_environment() as dir:
            locked_file_name = os.path.join(dir, 'foo')
            lock_file_name = locked_file_name + '.lock'

            lock = FileLock(locked_file_name)

            lock.lock()

            self.assertRegularFileExists(lock_file_name)

            lock.unlock()

            self.assertPathMissing(lock_file_name)

    def test_lock_failure(self):
        with self.prepared_environment() as dir:
            locked_file_name = os.path.join(dir, 'foo')
            lock_file_name = locked_file_name + '.lock'

            self.setFile(lock_file_name)

            lock = FileLock(locked_file_name)

            with self.assertRaises(ScanariumError) as c:
                lock.lock()

            self.assertEqual(c.exception.code, 'SE_LOCK_FAILED')

            self.assertRegularFileExists(lock_file_name)

            lock.unlock()

            self.assertRegularFileExists(lock_file_name)

    def test_lock_force(self):
        with self.prepared_environment() as dir:
            locked_file_name = os.path.join(dir, 'foo')
            lock_file_name = locked_file_name + '.lock'

            self.setFile(lock_file_name)

            lock = FileLock(locked_file_name)

            with self.assertRaises(ScanariumError) as c:
                lock.lock()

            self.assertEqual(c.exception.code, 'SE_LOCK_FAILED')

            lock.lock(force=True)

            self.assertRegularFileExists(lock_file_name)

            lock.unlock()

            self.assertPathMissing(lock_file_name)
