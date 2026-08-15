# ScanBack

> Lives in the `return-apps` monorepo under `projects/scan-back`.

Mobile-first Angular web app that scans **QR codes and barcodes** and can redirect the scanned value back to a calling app via URL. Everything runs client-side — no backend in v1.

## Requirements

- Mobile browser with a camera
- **HTTPS** (or `localhost`) — required for `getUserMedia`
- Modern Chromium / Safari / Firefox

## Getting started

From the workspace root:

```bash
npm install
npm run start:scan-back
```

Open `http://localhost:4201/`.

Useful routes:

| Route | Description |
|-------|-------------|
| `/` | Landing + short integration notes |
| `/scan` | Scanner (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open the scanner

```text
https://scan-back.purified.app/scan?returnUrl=<urlencoded-absolute-url>&state=<optional>&formats=<optional>
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` URL (or `http://localhost`) |
| `state` | no | Opaque string mirrored back unchanged |
| `formats` | no | e.g. `QR_CODE,EAN_13,CODE_128` |

Without `returnUrl`, the result is shown in the UI with a copy button.

### Return after scan

```text
<returnUrl>?scanValue=<value>&format=<format>&state=<state>
```

On cancel: `error=cancelled` (+ `state` if set).

Example:

```js
const returnUrl = `${location.origin}/my-app/callback`;
location.href =
  `https://scan-back.purified.app/scan?returnUrl=${encodeURIComponent(returnUrl)}&state=field1`;
```

```js
const params = new URLSearchParams(location.search);
const scanValue = params.get('scanValue');
```

## Return URL rules

`returnUrl` must be an absolute **`https:`** URL, or **`http://localhost`** / **`http://127.0.0.1`** for local development. Any https origin is accepted. Dangerous schemes (`javascript:`, `data:`, etc.) are rejected.

## Build

```bash
npm run build:scan-back
```

Production build uses `baseHref` `/` (custom domain at site root). Output:

`dist/scan-back/browser`

## Deploy: GitHub Pages + custom domain

App URL: **https://scan-back.purified.app**

Deploy is driven from this monorepo (`.github/workflows/deploy-scan-back.yml`) and publishes to `purified-app/scan-back` on the `gh-pages` branch. See the root [README](../README.md#deploy).

### DNS (`purified.app`)

| Host / name | Type  | Value |
|-------------|-------|--------|
| `scan-back` | CNAME | `purified-app.github.io` |

`public/CNAME` is included in the build so Pages keeps the domain on each deploy. Deep links like `/scan` work via the included `404.html` SPA fallback.

### Caller apps

```text
https://scan-back.purified.app/scan?returnUrl=<urlencoded-https-url>&state=<optional>
```

## Stack

- Angular 22 (standalone, signals)
- ZXing (`@zxing/browser` + `@zxing/library`)
- GitHub Pages + Actions
