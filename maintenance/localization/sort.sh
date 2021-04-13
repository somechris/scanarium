#!/bin/bash

set -e
set -o pipefail

cd "$(dirname "$0")"
cd ..

for L10N_FILE in localization/*.json
do
    echo "$L10N_FILE ..."
    jq -S . <"$L10N_FILE" >"$L10N_FILE.tmp" && mv "$L10N_FILE.tmp" "$L10N_FILE"
done
