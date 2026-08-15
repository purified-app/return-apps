#!/usr/bin/env bash
# Assemble a GitHub Pages site: /return-apps/<app>/...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Project Pages base. When attaching a custom domain at site root, set:
#   PAGES_BASE=  bun run build:site
PAGES_BASE="${PAGES_BASE:-/return-apps}"
PAGES_BASE="${PAGES_BASE%/}"

APPS=(sign-back scan-back geo-back map-pick-back pin-back nfc-back color-back)

echo "Building shared-ui…"
bun run build:shared-ui

SITE_DIR="dist/site"
rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"
cp site/index.html "$SITE_DIR/index.html"
cp site/404.html "$SITE_DIR/404.html"

# Keep root 404 pathSegmentsToKeep in sync with PAGES_BASE depth.
# /return-apps → 2 segments; empty (custom domain root) → 1 for /<app>/...
if [[ -z "$PAGES_BASE" ]]; then
  SEGMENTS=1
else
  SEGMENTS=$(echo "$PAGES_BASE" | awk -F'/' '{print NF-1}')
  SEGMENTS=$((SEGMENTS + 1))
fi
sed -i "s/var pathSegmentsToKeep = [0-9]*;/var pathSegmentsToKeep = ${SEGMENTS};/" "$SITE_DIR/404.html"

for app in "${APPS[@]}"; do
  href="${PAGES_BASE}/${app}/"
  echo "Building ${app} (baseHref ${href})…"
  bunx ng build "$app" --configuration production --base-href "$href"
  mkdir -p "$SITE_DIR/$app"
  cp -R "dist/$app/browser/." "$SITE_DIR/$app/"
  # Per-app 404 must keep the same segment count as the site root fallback.
  if [[ -f "$SITE_DIR/$app/404.html" ]]; then
    sed -i "s/var pathSegmentsToKeep = [0-9]*;/var pathSegmentsToKeep = ${SEGMENTS};/" \
      "$SITE_DIR/$app/404.html"
  fi
done

echo "Site ready at ${SITE_DIR}/ (open via GitHub Pages ${PAGES_BASE:-/})"
