# ColorBack

> Lives in the `return-apps` monorepo under `projects/color-back`.

Mobile-first Angular web app that samples a **color from the camera** (center crosshair) and can redirect hex/RGB back to a calling app via URL. Everything runs client-side — no backend in v1.

## Requirements

- Mobile browser with a camera
- **HTTPS** (or `localhost`) — required for `getUserMedia`

## Getting started

```bash
bun install
bun run start:color-back
```

Open `http://localhost:4206/`.

| Route | Description |
|-------|-------------|
| `/` | Landing + integration notes |
| `/color` | Eyedropper (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open

```text
https://purified-app.github.io/return-apps/color-back/color?returnUrl=<urlencoded-absolute-url>&state=<optional>
```

### Return after Use color

```text
<returnUrl>?hex=<#rrggbb>&rgb=<r,g,b>&format=hex&state=<state>
```

On cancel: `error=cancelled` (+ `state` if set).
