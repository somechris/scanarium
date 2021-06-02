#!/usr/bin/env python3
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import os
import sys

SCANARIUM_DIR_ABS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, SCANARIUM_DIR_ABS)
from scanarium import Scanarium
from scanarium import ScanariumError
del sys.path[0]

logger = logging.getLogger(__name__)


def update_password(scanarium, old_password, new_password):
    pod = os.environ['INSTANCE_NAME']
    username = os.environ['REMOTE_USER']
    stdin = f'{pod}\n{username}\n{old_password}\n{new_password}\n'
    cmd = scanarium.get_config('cgi:update-password', 'delegate')
    try:
        scanarium.run([cmd], input=stdin)
    except ScanariumError as e:
        if e.code == 'SE_RETURN_VALUE':
            stderr_lines = e.private_parameters['stderr'].split('\n')
            if len(stderr_lines) >= 2 \
                    and stderr_lines[-2].startswith('RuntimeError: ') \
                    and stderr_lines[-1] == '':
                msg = stderr_lines[-2][14:]
                raise ScanariumError(
                    'SE_PWD_UPDATE_BACKEND_MSG',
                    msg)

            raise ScanariumError(
                'SE_PWD_UPDATE_RETURN_VALUE',
                'Backend failed')

        if e.code == 'SE_TIMEOUT':
            raise ScanariumError(
                'SE_PWD_UPDATE_TIMEOUT',
                'Update process timed out')

        raise e
    return {}


def register_arguments(scanarium, parser):
    parser.add_argument('OLD_PASSWORD', help='The current password')
    parser.add_argument('NEW_PASSWORD', help='The new password')


if __name__ == "__main__":
    scanarium = Scanarium()
    args = scanarium.handle_arguments(
        'Updates the password for a user. Do NOT call this script directly in '
        'production, as passing passwords as command-line arguments on '
        'command-line might expose them to other users that can view process '
        'names. Instead, call it through CGI, where parameters are not passed '
        'as command-line arguments.',
        register_arguments,
        whitelisted_cgi_fields={'old-password': 1, 'new-password': 2})
    scanarium.call_guarded(update_password, args.OLD_PASSWORD,
                           args.NEW_PASSWORD)
