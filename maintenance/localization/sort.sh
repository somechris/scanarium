#!/bin/bash

source "$(dirname "$0")/common.inc"

sort_file() {
    jq -S . <"$L10N_FILE" >"$L10N_FILE.tmp" && mv "$L10N_FILE.tmp" "$L10N_FILE"
}

for_all_json_files sort_file
