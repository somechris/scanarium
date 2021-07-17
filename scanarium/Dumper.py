# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import json
import os
import tempfile

JSON_DUMP_ARGS = {'indent': 2, 'sort_keys': True}


class Dumper(object):
    def dump_json_string(self, data):
        return json.dumps(data, **JSON_DUMP_ARGS)

    def dump_json(self, file, data):
        self.dump_text(file, self.dump_json_string(data))

    def dump_text(self, file, data):
        dir = os.path.dirname(file)
        os.makedirs(dir, exist_ok=True)
        tmp_file = tempfile.NamedTemporaryFile(mode='w+', dir=dir,
                                               delete=False)

        try:
            tmp_file.write(data)
        finally:
            tmp_file.close()
        os.replace(tmp_file.name, file)
