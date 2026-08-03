#!/usr/bin/env bash
# Compile and upload a sketch to the ESP32-WROVER board.
#   ./flash.sh              -> BodhiBox
#   ./flash.sh PortScanner  -> PortScanner
#   ./flash.sh FirstDistance --publish
#     also runs ./publish-firmware.sh, so the lesson page's web installer
#     (docs/binoculars.html) picks up this build too.
set -euo pipefail

SKETCH="${1:-BodhiBox}"
FQBN="esp32:esp32:esp32wrover"
PORT="${PORT:-/dev/cu.usbserial-210}"

cd "$(dirname "$0")"

if [ ! -d "$SKETCH" ]; then
  echo "No such sketch: $SKETCH" >&2
  exit 1
fi

if [ ! -e "$PORT" ]; then
  echo "Board not found at $PORT. Plugged in? Try: arduino-cli board list" >&2
  echo "Override with: PORT=/dev/cu.something ./flash.sh $SKETCH" >&2
  exit 1
fi

echo "==> Compiling $SKETCH"
arduino-cli compile --fqbn "$FQBN" "$SKETCH"

echo "==> Uploading $SKETCH to $PORT"
if ! arduino-cli upload -p "$PORT" --fqbn "$FQBN" "$SKETCH"; then
  echo "==> Upload failed; retrying at 115200 baud"
  arduino-cli upload -p "$PORT" --fqbn "${FQBN}:UploadSpeed=115200" "$SKETCH"
fi

if [ "${2:-}" = "--publish" ]; then
  ./publish-firmware.sh "$SKETCH"
fi

echo "==> Done. Watch it with: ./monitor.sh"
