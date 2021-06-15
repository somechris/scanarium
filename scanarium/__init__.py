# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

# flake8: noqa

def allow_non_default_dependencies():
    import os
    try:
        return os.environ['SCANARIUM_SKIP_NON_DEFAULT_DEPENDENCIES'] != 'yes'
    except KeyError:
        return True

from .Config import Config
from .CommandLogger import CommandLogger
from .Dumper import Dumper
from .Environment import Environment
from .FileLock import FileLock
from .Indexer import Indexer
from .MessageFormatter import MessageFormatter
from .Localizer import Localizer
from .LocalizerFactory import LocalizerFactory
from .Resetter import Resetter
from .Result import Result
if allow_non_default_dependencies():
    from .Scanner import Scanner
from .Scanarium import Scanarium
from .ScanariumError import ScanariumError
from .Util import Util
