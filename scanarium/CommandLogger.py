# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import os

from .Result import Result

logger = logging.getLogger(__name__)


class CommandLogger(object):
    def __init__(self, dynamic_dir, dumper):
        super(CommandLogger, self).__init__()
        self._dump_target = os.path.join(dynamic_dir, 'command-log.json')
        self._dumper = dumper

    def dump(self, results):
        dicts = [result.as_dict() for result in results]
        self._dumper.dump_json(self._dump_target, dicts)

    def log(self, payload={}, exc_info=None, command=None, parameters=[]):
        result = Result(payload, exc_info, command=command,
                        parameters=parameters)
        logging.debug('command-log: %s' % (str(result.as_dict())))
        self.dump([result])
        return result
