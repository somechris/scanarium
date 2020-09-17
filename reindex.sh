#!/bin/sh

cd "$(dirname "$0")"

exec backend/reindex.py "$@"
