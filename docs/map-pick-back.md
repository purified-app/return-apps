# MapPickBack

> Lives in the `return-apps` monorepo under `projects/map-pick-back`.

Mobile-first Angular web app with a **Leaflet** map. The user places a pin and can redirect coordinates back to a calling app via URL. Tiles: OpenStreetMap. Everything runs client-side — no backend in v1.

## Getting started

```bash
bun install
bun run start:map-pick-back
```

Open `http://localhost:4203/`.

| Route | Description |
|-------|-------------|
| `/` | Landing + integration notes |
| `/map` | Map picker (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open

```text
https://map-pick-back.purified.app/map?returnUrl=<urlencoded-absolute-url>&state=<optional>&lat=<optional>&lng=<optional>&zoom=<optional>
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` URL (or `http://localhost`) |
| `state` | no | Opaque string mirrored back unchanged |
| `lat` / `lng` / `zoom` | no | Initial map center / zoom |

### Return after Done

```text
<returnUrl>?lat=<lat>&lng=<lng>&zoom=<zoom>&format=map-pin&state=<state>
```

On cancel: `error=cancelled` (+ `state` if set).
