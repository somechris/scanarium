#!/bin/sh

cd "$(dirname "$0")"

exec services/demo-server.py "$@"
