# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import json
import logging
import os

from .Result import Result
from .FileLock import FileLock

logger = logging.getLogger(__name__)


class CommandLogger(object):
    def __init__(self, dynamic_dir, dumper):
        super(CommandLogger, self).__init__()
        self._dump_target = os.path.join(dynamic_dir, 'command-log.json')
        self._dumper = dumper

    def dump(self, entry):
        lock = FileLock(self._dump_target)
        lock.lock(force=True)
        self.raw_dump(entry)
        lock.unlock()

    def raw_dump(self, entry):
        entries = []
        try:
            with open(self._dump_target, 'rt') as f:
                entries = json.load(f)
        except Exception:
            # reading the old state failed. Maybe the file does not
            # exist, or it got corrupted at some point.
            # We ignore this and assume there are no old entries
            pass

        try:
            entries.append(entry)
        except Exception:
            # Appending fails if the old json entries were not a list. In this
            # case, the loaded json is corrupt.
            # So we throw it away and start over afresh
            entries = [entry]

        self._dumper.dump_json(self._dump_target, entries[-5:])

    def log(self, payload={}, exc_info=None, command=None, parameters=[]):
        result = Result(payload, exc_info, command=command,
                        parameters=parameters)
        logging.debug('command-log: %s' % (str(result.as_dict())))
        self.dump(result.as_dict())
        return result
