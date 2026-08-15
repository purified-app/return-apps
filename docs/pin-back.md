# PinBack

> Lives in the `return-apps` monorepo under `projects/pin-back`.

Mobile-first Angular web app with a **numeric PIN keypad** that can redirect the entered PIN back to a calling app via URL. Everything runs client-side — no backend in v1.

## Getting started

```bash
bun install
bun run start:pin-back
```

Open `http://localhost:4204/`.

| Route | Description |
|-------|-------------|
| `/` | Landing + integration notes |
| `/pin` | Keypad (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open

```text
https://pin-back.purified.app/pin?returnUrl=<urlencoded-absolute-url>&state=<optional>&length=<optional>&mask=<optional>
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` URL (or `http://localhost`) |
| `state` | no | Opaque string mirrored back unchanged |
| `length` | no | PIN length 3–12 (default `4`) |
| `mask` | no | `false` / `0` to show digits instead of bullets |

### Return after Done

```text
<returnUrl>?pin=<digits>&format=pin&state=<state>
```

On cancel: `error=cancelled` (+ `state` if set).
