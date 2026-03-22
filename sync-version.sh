#!/usr/bin/env bash
set -euo pipefail

# Syncs the version from package.json into manifest.json
# Usage: ./sync-version.sh [--check]
#   --check: Only verify versions match (for CI), don't modify files

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_JSON="$ROOT_DIR/package.json"
MANIFEST_JSON="$ROOT_DIR/qa-locations-ext/manifest.json"

PKG_VERSION=$(node -p "require('$PACKAGE_JSON').version")
MANIFEST_VERSION=$(node -p "require('$MANIFEST_JSON').version")

if [ "${1:-}" = "--check" ]; then
  if [ "$PKG_VERSION" != "$MANIFEST_VERSION" ]; then
    echo "ERROR: Version mismatch!"
    echo "  package.json:  $PKG_VERSION"
    echo "  manifest.json: $MANIFEST_VERSION"
    echo ""
    echo "Update manifest.json to match package.json, or run ./sync-version.sh to fix."
    exit 1
  fi
  echo "Versions match: $PKG_VERSION"
  exit 0
fi

if [ "$PKG_VERSION" = "$MANIFEST_VERSION" ]; then
  echo "Versions already in sync: $PKG_VERSION"
  exit 0
fi

# Update manifest.json version to match package.json
node -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('$MANIFEST_JSON', 'utf8'));
manifest.version = '$PKG_VERSION';
fs.writeFileSync('$MANIFEST_JSON', JSON.stringify(manifest, null, 2) + '\n');
"

echo "Synced manifest.json version: $MANIFEST_VERSION -> $PKG_VERSION"
