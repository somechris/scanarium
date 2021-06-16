# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import os
import uuid

from .ScanariumError import ScanariumError


class Result(object):
    def __init__(self, payload={}, exc_info=None, command=None, parameters=[]):
        super(Result, self).__init__()
        self.uuid = None
        self.command = command
        self.parameters = parameters
        self.payload = payload
        self.is_ok = exc_info is None

        self.error_code = None
        self.error_message = None
        self.error_template = None
        self.error_parameters = {}

        try:
            self.method = os.environ['SCANARIUM_METHOD']
        except KeyError:
            self.method = None

        if exc_info is not None and len(exc_info) > 1:
            e = exc_info[1]
            if isinstance(e, ScanariumError):
                self.error_code = e.code
                self.error_message = e.message
                self.error_template = e.template
                self.error_parameters = e.parameters
                self.uuid = e.uuid
            else:
                self.error_code = 'SE_UNDEF'
                self.error_message = 'undefined error'
                self.error_template = self.error_message

        if self.uuid is None:
            self.uuid = uuid.uuid4()

    def as_dict(self):
        return {
            'command': self.command,
            'parameters': self.parameters,
            'uuid': str(self.uuid),
            'payload': self.payload,
            'method': self.method,
            'is_ok': self.is_ok,
            'error_code': self.error_code,
            'error_message': self.error_message,
            'error_template': self.error_template,
            'error_parameters': self.error_parameters,
        }

    def __str__(self):
        ret = f'Result(uuid={self.uuid}, command={self.command}' \
            f', parameters={self.parameters}, payload={self.payload}'
        if self.method:
            ret += f', method={self.method}'
        if not self.is_ok:
            ret += f', error_code={self.error_code}'
        ret += ')'
        return ret
