# return-apps

Angular workspace for **returnUrl** helper apps — small client-side tools that capture something (signature, scan, location, …) and redirect the result back to a calling app.

## Live site (one repo)

All apps are published from this repository to GitHub Pages:

**https://purified-app.github.io/return-apps/**

| App | URL |
|-----|-----|
| Hub | https://purified-app.github.io/return-apps/ |
| SignBack | …/sign-back/ |
| ScanBack | …/scan-back/ |
| GeoBack | …/geo-back/ |
| MapPickBack | …/map-pick-back/ |
| PinBack | …/pin-back/ |
| NfcBack | …/nfc-back/ |
| ColorBack | …/color-back/ |

Local serve still uses root paths (`/sign`, `/geo`, …) on separate ports.

## Apps

| App | Path | Local |
|-----|------|-------|
| **SignBack** | `projects/sign-back` | `bun run start:sign-back` → :4200 |
| **ScanBack** | `projects/scan-back` | `bun run start:scan-back` → :4201 |
| **GeoBack** | `projects/geo-back` | `bun run start:geo-back` → :4202 |
| **MapPickBack** | `projects/map-pick-back` | `bun run start:map-pick-back` → :4203 |
| **PinBack** | `projects/pin-back` | `bun run start:pin-back` → :4204 |
| **NfcBack** | `projects/nfc-back` | `bun run start:nfc-back` → :4205 |
| **ColorBack** | `projects/color-back` | `bun run start:color-back` → :4206 |

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
| `bun run build` / `build:site` | Build all apps into `dist/site/` for Pages |
| `bun run build:shared-ui` | Build the shared library |
| `bun run build:<app>` | Single-app production build (CI) |
| `bun run test` | Unit tests for lib + all apps |

## Workspace layout

```text
return-apps/
  projects/
    shared-ui/
    sign-back/ scan-back/ geo-back/ map-pick-back/
    pin-back/ nfc-back/ color-back/
  site/                 # Pages hub (index + root 404)
  scripts/build-site.sh
  docs/
```

## Deploy

One workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

1. In **Settings → Pages**: Source = **GitHub Actions**
2. Push to `main` (or run the workflow manually)
3. Site: `https://purified-app.github.io/return-apps/`

No separate app repos or `DEPLOY_GITHUB_TOKEN` needed.

### Optional custom domain

Point e.g. `return.purified.app` at GitHub Pages, add `site/CNAME`, and build with an empty base:

```bash
PAGES_BASE= bun run build:site
```

Then URLs become `https://return.purified.app/sign-back/`, etc. Update `PAGES_BASE` in the deploy workflow to match.

## Stack

- Bun (package manager)
- Angular 22 (standalone, signals)
- SignBack: canvas → SVG data URL
- ScanBack: ZXing
- MapPickBack: Leaflet + OpenStreetMap
- GeoBack / PinBack / NfcBack / ColorBack: Geolocation, keypad, Web NFC, `getUserMedia`
- GitHub Pages (single site, path per app)
