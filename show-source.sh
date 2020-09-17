#!/bin/sh

cd "$(dirname "$0")"

exec backend/show-source.py "$@"
