#!/usr/bin/env bash
# Assemble a GitHub Pages site at custom-domain root: /<app>/...
# Short public paths (sign, scan, …); Angular project names stay *-back.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Custom domain at site root (return.purified.app). For project Pages without a
# custom domain, set: PAGES_BASE=/return-apps bun run build:site
PAGES_BASE="${PAGES_BASE:-}"
PAGES_BASE="${PAGES_BASE%/}"

# project_name → public URL segment
APPS=(
  sign-back:sign
  scan-back:scan
  geo-back:geo
  map-pick-back:map
  pin-back:pin
  nfc-back:nfc
  color-back:color
)

echo "Building shared-ui…"
bun run build:shared-ui

SITE_DIR="dist/site"
rm -rf "$SITE_DIR"
mkdir -p "$SITE_DIR"
cp site/index.html "$SITE_DIR/index.html"
mkdir -p "$SITE_DIR/developers"
cp site/developers/index.html "$SITE_DIR/developers/index.html"
cp site/404.html "$SITE_DIR/404.html"
cp site/apps.json "$SITE_DIR/apps.json"
cp site/llms.txt "$SITE_DIR/llms.txt"
cp site/manifest.webmanifest "$SITE_DIR/manifest.webmanifest"
cp site/sw.js "$SITE_DIR/sw.js"
mkdir -p "$SITE_DIR/icons"
cp site/icons/icon-192.png "$SITE_DIR/icons/icon-192.png"
cp site/icons/icon-512.png "$SITE_DIR/icons/icon-512.png"
cp site/icons/icon-512-maskable.png "$SITE_DIR/icons/icon-512-maskable.png"
cp site/icons/toolbox.svg "$SITE_DIR/icons/toolbox.svg"
mkdir -p "$SITE_DIR/sdk"
cp site/sdk/return-apps.mjs "$SITE_DIR/sdk/return-apps.mjs"
if [[ -f site/CNAME ]]; then
  cp site/CNAME "$SITE_DIR/CNAME"
fi

# Keep root 404 pathSegmentsToKeep in sync with PAGES_BASE depth.
# /return-apps → 2 segments; empty (custom domain root) → 1 for /<app>/...
if [[ -z "$PAGES_BASE" ]]; then
  SEGMENTS=1
else
  SEGMENTS=$(echo "$PAGES_BASE" | awk -F'/' '{print NF-1}')
  SEGMENTS=$((SEGMENTS + 1))
fi
sed -i "s/var pathSegmentsToKeep = [0-9]*;/var pathSegmentsToKeep = ${SEGMENTS};/" "$SITE_DIR/404.html"

for entry in "${APPS[@]}"; do
  app="${entry%%:*}"
  slug="${entry##*:}"
  href="${PAGES_BASE}/${slug}/"
  echo "Building ${app} → ${slug}/ (baseHref ${href})…"
  bunx ng build "$app" --configuration production --base-href "$href"
  mkdir -p "$SITE_DIR/$slug"
  cp -R "dist/$app/browser/." "$SITE_DIR/$slug/"
  # Per-app 404 must keep the same segment count as the site root fallback.
  if [[ -f "$SITE_DIR/$slug/404.html" ]]; then
    sed -i "s/var pathSegmentsToKeep = [0-9]*;/var pathSegmentsToKeep = ${SEGMENTS};/" \
      "$SITE_DIR/$slug/404.html"
  fi
done

echo "Site ready at ${SITE_DIR}/ (open via GitHub Pages ${PAGES_BASE:-/})"
