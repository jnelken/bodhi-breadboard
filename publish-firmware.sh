#!/usr/bin/env bash
# Rebuilds a sketch and copies flashable binaries + a manifest into
# docs/firmware/<sketch>/, for the Web Serial installer on that sketch's
# lesson page (see the <esp-web-install-button> on docs/binoculars.html).
# Offsets match what arduino-cli upload's own esptool invocation already
# uses (confirmed against its output): bootloader at 0x1000, partitions at
# 0x8000, boot_app0 at 0xe000, app at 0x10000.
#
#   ./publish-firmware.sh FirstDistance
#
# These binaries get committed to git — GitHub Pages serves docs/ straight
# from the repo with no build step, so re-run this (and commit) whenever the
# sketch changes, or the web installer silently serves stale firmware.
set -euo pipefail

SKETCH="${1:?usage: ./publish-firmware.sh <Sketch>}"
FQBN="esp32:esp32:esp32wrover"
ARDUINO15="${ARDUINO15:-$HOME/Library/Arduino15}"

cd "$(dirname "$0")"

if [ ! -d "$SKETCH" ]; then
  echo "No such sketch: $SKETCH" >&2
  exit 1
fi

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

echo "==> Compiling $SKETCH for publish"
arduino-cli compile --fqbn "$FQBN" --output-dir "$OUT" "$SKETCH"

BOOT_APP0="$(find "$ARDUINO15/packages/esp32/hardware/esp32" -name boot_app0.bin 2>/dev/null | head -1)"
if [ -z "$BOOT_APP0" ]; then
  echo "Could not find boot_app0.bin under $ARDUINO15 — is the esp32 core installed there?" >&2
  echo "Override the search root with: ARDUINO15=/path/to/Arduino15 ./publish-firmware.sh $SKETCH" >&2
  exit 1
fi

DEST="docs/firmware/$SKETCH"
mkdir -p "$DEST"
cp "$OUT/$SKETCH.ino.bootloader.bin" "$DEST/bootloader.bin"
cp "$OUT/$SKETCH.ino.partitions.bin" "$DEST/partitions.bin"
cp "$OUT/$SKETCH.ino.bin" "$DEST/firmware.bin"
cp "$BOOT_APP0" "$DEST/boot_app0.bin"

cat > "$DEST/manifest.json" <<EOF
{
  "name": "$SKETCH",
  "version": "1.0.0",
  "builds": [
    {
      "chipFamily": "ESP32",
      "parts": [
        { "path": "bootloader.bin", "offset": 4096 },
        { "path": "partitions.bin", "offset": 32768 },
        { "path": "boot_app0.bin", "offset": 57344 },
        { "path": "firmware.bin", "offset": 65536 }
      ]
    }
  ]
}
EOF

echo "==> Published $DEST — remember to commit these binaries."
