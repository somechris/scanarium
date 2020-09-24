#!/bin/sh

cd "$(dirname "$0")"

exec backend/regenerate-static-content.py "$@"
