# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import time

from .ScanariumError import ScanariumError


class FileLock(object):
    def __init__(self, file_name):
        self.file_name = file_name
        self.lock_file_name = file_name + '.lock'
        self.locked = False

    def lock(self, force=False):
        if not self.locked:
            os.makedirs(os.path.dirname(self.lock_file_name), exist_ok=True)
            start = time.time()
            flags = os.O_CREAT | os.O_EXCL | os.O_WRONLY
            while not self.locked:
                try:
                    os.close(os.open(self.lock_file_name, flags))
                    self.locked = True
                except Exception:
                    if time.time() - start > 2:
                        if force:
                            self.locked = True
                        else:
                            raise ScanariumError(
                                'SE_LOCK_FAILED',
                                'Locking "{file_name}" via "{lock_file_name}" '
                                'failed', {
                                    'file_name': self.file_name,
                                    'lock_file_name': self.lock_file_name,
                                    })
                    else:
                        time.sleep(0.1)

    def unlock(self):
        if self.locked:
            self.locked = False
            try:
                os.unlink(self.lock_file_name)
            except Exception:
                # Unlinking failed. We swallow that error, as unlinking is
                # not the main concern of this class.
                pass

    def __del__(self):
        self.unlock()
