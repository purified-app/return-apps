# return-apps

Angular workspace for **returnUrl** helper apps — small client-side tools that capture something (signature, scan, location, …) and return the result to a calling app.

**Contract v1:** always `value` + `format` (and `error` on cancel). Optional `allowedOrigins` and `delivery=query|hash` (pin/sign default to hash).

**Start here:** [docs/integration.md](docs/integration.md) (developers + AI agents) · [contract-v1.md](docs/contract-v1.md) · live [`apps.json`](https://return.purified.app/apps.json) · [`llms.txt`](https://return.purified.app/llms.txt) · SDK [`/sdk/return-apps.mjs`](https://return.purified.app/sdk/return-apps.mjs).

## Live site

**https://return.purified.app/**

| App | URL | Default delivery |
|-----|-----|------------------|
| Hub | https://return.purified.app/ | — |
| Sign | https://return.purified.app/sign/ | hash |
| Scan | https://return.purified.app/scan/ | query |
| Geo | https://return.purified.app/geo/ | query |
| Map | https://return.purified.app/map/ | query |
| Pin | https://return.purified.app/pin/ | hash |
| NFC | https://return.purified.app/nfc/ | query |
| Color | https://return.purified.app/color/ | query |
| Level | https://return.purified.app/level/ | query |

Caller entry is the app root, e.g. `https://return.purified.app/sign?returnUrl=…&allowedOrigins=…`. Docs UI lives at `/home` inside each app.

## Apps

| App | Path | Local |
|-----|------|-------|
| **Sign** | `projects/sign` | `bun run start:sign` → :4200 |
| **Scan** | `projects/scan` | `bun run start:scan` → :4201 |
| **Geo** | `projects/geo` | `bun run start:geo` → :4202 |
| **Map** | `projects/map` | `bun run start:map` → :4203 |
| **Pin** | `projects/pin` | `bun run start:pin` → :4204 |
| **NFC** | `projects/nfc` | `bun run start:nfc` → :4205 |
| **Color** | `projects/color` | `bun run start:color` → :4206 |
| **Level** | `projects/level` | `bun run start:level` → :4207 |

Shared library: **`shared-ui`** — styles, `ReturnUrlValidator`, `RbHomeDocs`, `RbDemoCaller`, `RbPanel`.  
SDK: **`site/sdk/return-apps.mjs`**. Catalog: **`site/apps.json`**.

Per-app docs: [docs/](docs/).

## Requirements

- [Bun](https://bun.sh) **1.3+**
- Node.js **22.22+** (used by the Angular toolchain)

## Getting started

```bash
bun install
bun run start:geo   # or any start:* script above
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run start:<app>` | Serve one app (ports 4200–4207) |
| `bun run build` / `build:site` | Build all apps into `dist/site/` for Pages |
| `bun run build:shared-ui` | Build the shared library |
| `bun run build:<app>` | Single-app production build (CI) |
| `bun run test` | Unit tests for lib + all apps |

## Workspace layout

```text
return-apps/
  projects/
    shared-ui/
    sign/ scan/ geo/ map/
    pin/ nfc/ color/ level/
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

## Stack

- Bun (package manager)
- Angular 22 (standalone, signals)
- Sign: canvas → SVG data URL
- Scan: Barcode Detection API + `barcode-detector` ponyfill
- Map: Leaflet + OpenStreetMap (pick / measure / area)
- Geo / Pin / NFC / Color / Level: Geolocation, keypad, Web NFC, `getUserMedia`, DeviceOrientation
- GitHub Pages (single site, short path per app)
