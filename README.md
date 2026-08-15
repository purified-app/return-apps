# return-apps

Angular workspace for **returnUrl** helper apps — small client-side tools that capture something (signature, scan, location, …) and redirect the result back to a calling app.

## Apps

| App | Path | Local | Production |
|-----|------|-------|------------|
| **SignBack** | `projects/sign-back` | `bun run start:sign-back` → :4200 | https://sign-back.purified.app |
| **ScanBack** | `projects/scan-back` | `bun run start:scan-back` → :4201 | https://scan-back.purified.app |
| **GeoBack** | `projects/geo-back` | `bun run start:geo-back` → :4202 | https://geo-back.purified.app |
| **MapPickBack** | `projects/map-pick-back` | `bun run start:map-pick-back` → :4203 | https://map-pick-back.purified.app |
| **PinBack** | `projects/pin-back` | `bun run start:pin-back` → :4204 | https://pin-back.purified.app |
| **NfcBack** | `projects/nfc-back` | `bun run start:nfc-back` → :4205 | https://nfc-back.purified.app |
| **ColorBack** | `projects/color-back` | `bun run start:color-back` → :4206 | https://color-back.purified.app |

Shared library: **`shared-ui`** (`projects/shared-ui`) — styles, `ReturnUrlValidator`, `appBaseUrl`, `RbPanel`, `RbMetaList`, `RbPage`.

Per-app docs: [docs/](docs/).

## Requirements

- [Bun](https://bun.sh) **1.3+**
- Node.js **22.22+** (used by the Angular toolchain)

## Getting started

```bash
bun install
bun run start:geo-back   # or any start:* script above
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run start:<app>` | Serve one app (ports 4200–4206) |
| `bun run build` | Build shared-ui + all apps |
| `bun run build:shared-ui` | Build the shared library |
| `bun run build:<app>` | Production build → `dist/<app>/browser` |
| `bun run test` | Unit tests for lib + all apps |

## Workspace layout

```text
return-apps/
  projects/
    shared-ui/       # shared styles + UI + returnUrl helpers
    sign-back/       # signature pad → returnUrl
    scan-back/       # QR/barcode scanner → returnUrl
    geo-back/        # GPS reading → returnUrl
    map-pick-back/   # Leaflet map pin → returnUrl
    pin-back/        # numeric PIN pad → returnUrl
    nfc-back/        # Web NFC read → returnUrl
    color-back/      # camera eyedropper → returnUrl
  docs/
  angular.json
```

## Deploy

Each app keeps its own custom domain. Because GitHub Pages is one site per repo, production builds are published to legacy app repos’ `gh-pages` branches (or create those repos when adding a new app).

| App | Deploy workflow | Target |
|-----|-----------------|--------|
| SignBack | `.github/workflows/deploy-sign-back.yml` | `purified-app/sign-back` |
| ScanBack | `.github/workflows/deploy-scan-back.yml` | `purified-app/scan-back` |
| GeoBack | `.github/workflows/deploy-geo-back.yml` | `purified-app/geo-back` |
| MapPickBack | `.github/workflows/deploy-map-pick-back.yml` | `purified-app/map-pick-back` |
| PinBack | `.github/workflows/deploy-pin-back.yml` | `purified-app/pin-back` |
| NfcBack | `.github/workflows/deploy-nfc-back.yml` | `purified-app/nfc-back` |
| ColorBack | `.github/workflows/deploy-color-back.yml` | `purified-app/color-back` |

### One-time setup

1. Add a repo secret **`DEPLOY_GITHUB_TOKEN`** on `return-apps` (PAT or fine-grained token with `contents: write` on the target repos).
2. Ensure each target repo exists and Pages is set to **Deploy from a branch** → **`gh-pages`** / `/` with the matching custom domain.
3. Push to `main` (or run the workflow manually). Path filters deploy only the app that changed.

CI builds and tests `shared-ui` and every app on every push/PR to `main`.

## Stack

- Bun (package manager)
- Angular 22 (standalone, signals)
- SignBack: canvas → SVG data URL
- ScanBack: ZXing (`@zxing/browser` + `@zxing/library`)
- MapPickBack: Leaflet + OpenStreetMap tiles
- GeoBack / PinBack / NfcBack / ColorBack: browser Geolocation, keypad UI, Web NFC, `getUserMedia`
- GitHub Actions
