#!/bin/bash
# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

GIT=/usr/bin/git

COMMAND=("$GIT" "clean" "-x" "-d")

BASENAME="$(basename "$0")"
BASENAME_PREP="${BASENAME%.sh}-"

if [[ "$BASENAME_PREP" == *"-keep-tox-"* ]]
then
	COMMAND+=("-e" "/.tox")
fi

if [[ "$BASENAME_PREP" == *"-keep-phaser-"* ]]
then
	COMMAND+=("-e" "/frontend/phaser-*")
fi

if [[ "$BASENAME_PREP" == *"-keep-config-"* ]]
then
	COMMAND+=("-e" "conf/scanarium.conf*" "-e" "/dynamic/config.json")
fi

if [[ "$BASENAME_PREP" == *"-keep-dynamic-"* ]]
then
	COMMAND+=("-e" "/dynamic")
fi

parse_args() {
  FOUND_FORCE_OR_DRY_ARG=no
  while [ $# -ge 1 ]
  do
    local ARG="$1"
    shift
    case "$ARG" in
      "-f" | "--force" | "-n" | "--dry-run" )
        FOUND_FORCE_OR_DRY_ARG=yes
        ;;
      * )
        :
        ;;
    esac
  done

}

parse_args "$@"
if [ "$FOUND_FORCE_OR_DRY_ARG" != "yes" ]
then
  # Neither `force` nor `dry` was found, so we assume `dry`
  COMMAND+=("--dry-run")
fi

COMMAND+=("$@")

echo "${COMMAND[@]}"
"${COMMAND[@]}"
if [ "$FOUND_FORCE_OR_DRY_ARG" != "yes" ]
then
  echo >&2
  echo "Found neither --force nor --dry-run, so we assume --dry-run. Pass --force to actually delete the files" >&2
fi
