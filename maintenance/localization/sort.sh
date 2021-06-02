#!/bin/bash
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

source "$(dirname "$0")/common.inc"

sort_file() {
    jq -S . <"$L10N_FILE" >"$L10N_FILE.tmp" && mv "$L10N_FILE.tmp" "$L10N_FILE"
}

for_all_json_files sort_file
