#!/bin/bash
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

source "$(dirname "$0")/common.inc"

dump_keys() {
    "$SCRIPT_DIR_ABS/dump-keys.sh" "$L10N_FILE"
}

check_keys() {
    local KEYS="$(dump_keys)"
    local KEYS_COUNT="$(echo "$KEYS" | wc -l)"
    local MISMATCHED_KEYS="$(diff <(echo "$KEYS") <(echo "$ALL_KEYS") | grep '^[<>]' || true)"
    local MISMATCHED_KEYS_COUNT="0"
    if [ -n "$MISMATCHED_KEYS" ]
    then
        MISMATCHED_KEYS_COUNT="$(echo "$MISMATCHED_KEYS" | wc -l)"
    fi
    local PERCENT="$(( (ALL_KEYS_COUNT - MISMATCHED_KEYS_COUNT ) * 100 / ALL_KEYS_COUNT))"

    SUFFIX=""

    if [ "$L10N_FILE" = "$NATIVE_L10N.json" ]
    then
        SUFFIX+=" (Native localization. $PERCENT% overruled)"
        PERCENT=100
    fi

    if [ "$L10N_FILE" = "$REFERENCE_L10N.json" ]
    then
        SUFFIX+=" (Reference localization)"
    fi

    if [ "$PERCENT" -lt 100 ]
    then
        if [ "$PERCENT" -lt 10 ]
        then
            PERCENT=" $PERCENT"
        fi
        PERCENT=" $PERCENT"
    fi

    echo "$PERCENT% $L10N_FILE (keys: $KEYS_COUNT)$SUFFIX"
    if [ "$PERCENT" != "100" ]
    then
        echo "$MISMATCHED_KEYS" | head -n 10 | sed -e 's/^/        /g'
    fi
}

ALL_KEYS=$(for_all_l10n_files dump_keys | grep -v '^__meta__/comment$' | sort | uniq)
ALL_KEYS_COUNT="$(echo "$ALL_KEYS" | wc -l)"
for_all_l10n_files check_keys

cat <<EOF

${ALL_KEYS_COUNT} keys
EOF