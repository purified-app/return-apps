# SignBack

> Lives in the `return-apps` monorepo under `projects/sign-back`.

Mobile-first Angular web app that captures a **handwritten signature** and can redirect it back to a calling app via URL (SVG data URL). Everything runs client-side — no backend in v1.

## Requirements

- Mobile or desktop browser with pointer/touch input
- **HTTPS** (or `localhost`) for production camera-less use is still recommended for callers
- Modern Chromium / Safari / Firefox

## Getting started

From the workspace root:

```bash
npm install
npm run start:sign-back
```

Open `http://localhost:4200/`.

Useful routes:

| Route | Description |
|-------|-------------|
| `/` | Landing + integration notes |
| `/sign` | Signature pad (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open the pad

```text
https://sign-back.purified.app/sign?returnUrl=<urlencoded-absolute-url>&state=<optional>
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` URL (or `http://localhost`) |
| `state` | no | Opaque string mirrored back unchanged |

Without `returnUrl`, the signature preview is shown in the UI.

### Return after Done

```text
<returnUrl>?signature=<svg-data-url>&format=image/svg+xml&state=<state>
```

On cancel: `error=cancelled` (+ `state` if set).

Example:

```js
const returnUrl = `${location.origin}/my-app/callback`;
location.href =
  `https://sign-back.purified.app/sign?returnUrl=${encodeURIComponent(returnUrl)}&state=field1`;
```

```js
const params = new URLSearchParams(location.search);
const signature = params.get('signature'); // data:image/svg+xml;base64,...
```

## Return URL rules

`returnUrl` must be absolute **`https:`**, or **`http://localhost`** / **`http://127.0.0.1`**. Any https origin is accepted. Dangerous schemes are rejected.

Signatures that are too large for a URL redirect are blocked with an error (keep strokes simpler).

## Build

```bash
npm run build:sign-back
```

Production uses `baseHref` `/` (custom domain). Output: `dist/sign-back/browser`

## Deploy: GitHub Pages + custom domain

App URL: **https://sign-back.purified.app**

Deploy is driven from this monorepo (`.github/workflows/deploy-sign-back.yml`) and publishes to `purified-app/sign-back` on the `gh-pages` branch. See the root [README](../README.md#deploy).

### DNS (`purified.app`)

| Host | Type | Value |
|------|------|--------|
| `sign-back` | CNAME | `purified-app.github.io` |

`public/CNAME` is included so the domain sticks across deploys. `404.html` provides SPA fallback for `/sign`.

## Stack

- Angular 22 (standalone, signals)
- Canvas signature pad → SVG data URL
- GitHub Pages + Actions
