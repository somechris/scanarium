# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Util
del sys.path[0]


from .environment import BasicTestCase


class UtilTest(BasicTestCase):
    def getUtil(self):
        return Util(None)

    def test_get_timestamp_for_filename_correct_format(self):
        timestamp = self.getUtil().get_timestamp_for_filename()
        self.assertFullMatch(r'[1-9][0-9]{9,}\.[0-9]{3}', timestamp)
