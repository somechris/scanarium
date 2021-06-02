#!/bin/bash
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

source "$(dirname "$0")/common.inc"

L10N_FILE="$1"
if [ -z "$L10N_FILE" ]
then
    L10N_FILE="de"
fi

if [ ! -e "$L10N_FILE" ]
then
    L10N_FILE="${L10N_FILE}.json"
fi

jq -r 'keys[] as $level1
    | .[$level1]
    | keys[] as $level2
    | if $level1 != "parameters" then
          $level1 + "/" + $level2
      else
          .[$level2]
              | keys[]
              | $level1 + "/" + $level2 + "/" + .
      end
    ' <"$L10N_FILE" \
    | sort
