# return-apps

Angular workspace for **returnUrl** helper apps — small client-side tools that capture something (signature, scan, location, …) and return the result to a calling app.

**Contract v1:** always `value` + `format` (and `error` on cancel). See [docs/contract-v1.md](docs/contract-v1.md), live catalog [`apps.json`](https://return.purified.app/apps.json), SDK [`/sdk/return-apps.mjs`](https://return.purified.app/sdk/return-apps.mjs).

## Live site

**https://return.purified.app/**

| App | URL | Default delivery |
|-----|-----|------------------|
| Hub | https://return.purified.app/ | — |
| SignBack | https://return.purified.app/sign/ | hash |
| ScanBack | https://return.purified.app/scan/ | query |
| GeoBack | https://return.purified.app/geo/ | query |
| MapPickBack | https://return.purified.app/map/ | query |
| PinBack | https://return.purified.app/pin/ | hash |
| NfcBack | https://return.purified.app/nfc/ | query |
| ColorBack | https://return.purified.app/color/ | query |

Caller entry is the app root, e.g. `https://return.purified.app/sign?returnUrl=…&allowedOrigins=…`. Docs UI lives at `/home` inside each app.

Local serve still uses root paths on separate ports (`/`, `/home`, `/demo-caller`).

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

Shared library: **`shared-ui`** — styles, return helpers, `RbHomeDocs`, `RbDemoCaller`.  
SDK: **`site/sdk/return-apps.mjs`**.

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
  site/                 # hub + apps.json + sdk + CNAME
  scripts/build-site.sh
  docs/
```

## Deploy

One workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

1. In **Settings → Pages**: Source = **GitHub Actions**, custom domain = `return.purified.app`
2. DNS for `return.purified.app` must point at GitHub Pages
3. Push to `main` (or run the workflow manually)
4. Site: `https://return.purified.app/`

`site/CNAME` is published with the site. Builds use an empty `PAGES_BASE` so each app is at `/sign/`, `/scan/`, etc.

Without the custom domain (project Pages only):

```bash
PAGES_BASE=/return-apps bun run build:site
```

## Stack

- Bun (package manager)
- Angular 22 (standalone, signals)
- SignBack: canvas → SVG data URL
- ScanBack: Barcode Detection API + `barcode-detector` ponyfill
- MapPickBack: Leaflet + OpenStreetMap
- GeoBack / PinBack / NfcBack / ColorBack: Geolocation, keypad, Web NFC, `getUserMedia`
- GitHub Pages (single site, short path per app)
