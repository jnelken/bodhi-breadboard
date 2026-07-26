#!/usr/bin/env bash
# Watch the board's serial output. Ctrl-C to quit.
set -euo pipefail

PORT="${PORT:-/dev/cu.usbserial-210}"

if [ ! -e "$PORT" ]; then
  echo "Board not found at $PORT. Plugged in? Try: arduino-cli board list" >&2
  exit 1
fi

exec arduino-cli monitor -p "$PORT" --config baudrate=115200
