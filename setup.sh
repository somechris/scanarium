#!/bin/bash

set -e
set -o pipefail

cd "$(dirname "$0")"

PHASER_VERSION="3.11.0"
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


step "phaser ${PHASER_VERSION}" "$PHASER_TARGET" curl --output "$PHASER_TARGET" "https://cdn.jsdelivr.net/npm/phaser@${PHASER_VERSION}/dist/phaser.js"
step "example configuration" "$CONF_TARGET" cp "conf/scanarium.conf.example" "$CONF_TARGET"
step "content directory" "dynamic" mkdir -p "dynamic"
step "sample content" "dynamic/scenes/space/actors/SimpleRocket/sample.png" cp -a "dynamic.sample/"* "dynamic"
step "reindexing content" "dynamic/scenes/space/actors-latest.json" ./reindex.sh

echo
echo "#################################################################"
echo
echo "All done."
echo
echo "Now edit '$CONF_TARGET' to your liking and start Scanarium by running ./run-demo-server.sh"