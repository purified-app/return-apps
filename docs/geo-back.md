# GeoBack

> Lives in the `return-apps` monorepo under `projects/geo-back`.

Mobile-first Angular web app that captures **GPS coordinates** and can redirect them back to a calling app via URL. Everything runs client-side — no backend in v1.

## Getting started

```bash
bun install
bun run start:geo-back
```

Open `http://localhost:4202/`.

| Route | Description |
|-------|-------------|
| `/` | Landing + integration notes |
| `/geo` | Locator (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open

```text
https://purified-app.github.io/return-apps/geo-back/geo?returnUrl=<urlencoded-absolute-url>&state=<optional>&highAccuracy=<optional>
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` URL (or `http://localhost`) |
| `state` | no | Opaque string mirrored back unchanged |
| `highAccuracy` | no | `false` / `0` to disable high-accuracy GPS |

### Return after success

```text
<returnUrl>?lat=<lat>&lng=<lng>&accuracy=<meters>&timestamp=<ms>&format=geo&state=<state>
```

Optional extras when available: `altitude`, `altitudeAccuracy`, `heading`, `speed`.

On cancel: `error=cancelled` (+ `state` if set).
