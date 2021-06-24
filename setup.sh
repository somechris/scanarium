#!/bin/bash
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

set -e
set -o pipefail

cd "$(dirname "$0")"

PHASER_VERSION="3.52.0"
PHASER_TARGET="frontend/phaser-${PHASER_VERSION}.js"
CONF_TARGET="conf/scanarium.conf"

step() {
    local NAME="$1"
    local TARGET="$2"
    shift 2

    echo
    echo "#################################################################"
    echo "Setting up $NAME at '$TARGET' ..."
    echo

    if [ ! -e "$TARGET" ]
    then
        echo "Running:" "$@"
        "$@"
    else
        echo "(Skipping as '$TARGET' already exists)"
    fi
}

generate_global_config() {
  echo "{}" >"dynamic/config.json"
}

generate_command_log() {
  echo "[]" >"dynamic/command-log.json"
}

generate_sample_content() {
    cp -a "dynamic.sample/"* "dynamic"
    local FILE=
    while read FILE
    do
        /usr/bin/env python3 - "$FILE" <<EOF
import os
import sys
from scanarium import Scanarium
dir, file = os.path.split(sys.argv[1])
Scanarium().generate_thumbnail(dir, file)
EOF
    done < <(find dynamic/scenes/*/actors -iname '*.png' ! -iname '*thumbnail.*')
}

step "phaser ${PHASER_VERSION}" "$PHASER_TARGET" curl --output "$PHASER_TARGET" "https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.min.js"
step "example configuration" "$CONF_TARGET" cp "conf/scanarium.conf.example" "$CONF_TARGET"
step "content directory" "dynamic" mkdir -p "dynamic"
step "sample content" "dynamic/scenes/space/actors/SimpleRocket/sample.png" generate_sample_content
step "global config" "dynamic/config.json" generate_global_config
step "command log" "dynamic/command-log.json" generate_command_log
step "regenerating static content" "scenes/space/scene-bait-thumb.jpg" ./regenerate-static-content.sh
step "reindexing content" "dynamic/scenes/space/actors-latest.json" ./reindex.sh

echo
echo "#################################################################"
echo
echo "All done."
echo
echo "Now edit '$CONF_TARGET' to your liking and start Scanarium by running ./run-demo-server.sh"
