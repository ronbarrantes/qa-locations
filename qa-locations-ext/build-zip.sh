#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$ROOT_DIR/dist"
OUTPUT_FILE="$OUTPUT_DIR/qr-locations-mvp.zip"

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_FILE"

cd "$ROOT_DIR"
zip -r "$OUTPUT_FILE" manifest.json popup.html popup.js styles.css >/dev/null

echo "Created $OUTPUT_FILE"
