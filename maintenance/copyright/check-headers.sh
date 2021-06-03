#!/bin/bash
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

# To skip over this skript, set the environment variable to something non-empty
# E.g.:
#
#   export SKIP_PRE_COMMIT=y
#

set -e
set -o pipefail

WARNINGS=0

warn() {
    echo "WARNING:" "$@" >&2
    echo >&2
    WARNINGS=$((WARNINGS+1))
}

check_copyright_headers_type() {
    local FILE_SUFFIX="$1"
    local COMMENT_MARKER="$2"
    local SKIP_RE="$3"

    local EXPECTED_COPYRIGHT_MARKER="\
$COMMENT_MARKER This file is part of Scanarium https://scanarium.com/ and licensed under the
$COMMENT_MARKER GNU Affero General Public License v3.0 (See LICENSE.md)
$COMMENT_MARKER SPDX-License-Identifier: AGPL-3.0-only"
    local EXPECTED_COPYRIGHT_MARKER_LINES="$(echo "$EXPECTED_COPYRIGHT_MARKER" | wc -l)"
    while read FILE ;
    do
        if [ "$(grep -v '^#!' "$FILE" | head -n "$EXPECTED_COPYRIGHT_MARKER_LINES")" \
            != "$EXPECTED_COPYRIGHT_MARKER" ]
        then
            if [[ ! "$FILE" =~ ^\./$SKIP_RE$ ]]
            then
                warn "Failed to find the following copyright marker in '$FILE':
$EXPECTED_COPYRIGHT_MARKER"
            fi
        fi
    done < <(find \
        -name '.tox' -prune \
        -o -type f -name "*$FILE_SUFFIX" -print \
            | sort)
}

check_copyright_headers() {
    check_copyright_headers_type .py '#'
    check_copyright_headers_type .js '//' 'frontend/phaser-.*'
    check_copyright_headers_type .sh '#'
    check_copyright_headers_type .inc '#'
}

check_copyright_headers

if [ "$WARNINGS" != 0 ]
then
    echo "Found $WARNINGS warnings. Aborting." >&2
    exit 1
fi
