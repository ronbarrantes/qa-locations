#!/usr/bin/env bash
set -euo pipefail

# Automatically bumps the version in package.json and syncs to manifest.json.
# Determines bump type from commit messages since the last version tag.
#
# Commit message conventions:
#   "major:" or "breaking:" prefix → major bump (0.1.1 → 1.0.0)
#   "minor:" or "feat:" prefix     → minor bump (0.1.1 → 0.2.0)
#   anything else                   → patch bump (0.1.1 → 0.1.2)
#
# Usage: ./bump-version.sh [--dry-run]

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_JSON="$ROOT_DIR/package.json"
DRY_RUN=false

if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=true
fi

CURRENT_VERSION=$(node -p "require('$PACKAGE_JSON').version")
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Determine bump type from commit messages since last tag
BUMP="patch"
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
  COMMITS=$(git log "$LAST_TAG"..HEAD --pretty=format:"%s" 2>/dev/null || echo "")
else
  COMMITS=$(git log --pretty=format:"%s" -20 2>/dev/null || echo "")
fi

if echo "$COMMITS" | grep -qiE "^(major|breaking):"; then
  BUMP="major"
elif echo "$COMMITS" | grep -qiE "^(minor|feat):"; then
  BUMP="minor"
fi

case "$BUMP" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "Bump type: $BUMP"
echo "Version: $CURRENT_VERSION → $NEW_VERSION"

if [ "$DRY_RUN" = true ]; then
  echo "(dry run — no files modified)"
  exit 0
fi

# Update package.json
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, 2) + '\n');
"

# Sync to manifest.json
"$ROOT_DIR/sync-version.sh"

echo "Updated to $NEW_VERSION"
