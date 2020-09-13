#!/bin/sh

cd "$(dirname "$0")"

exec demo-server/demo-server.py "$@"
