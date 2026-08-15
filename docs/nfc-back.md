# NfcBack

> Lives in the `return-apps` monorepo under `projects/nfc-back`.

Mobile-first Angular web app that reads an **NFC tag** via Web NFC and can redirect the payload back to a calling app via URL. Everything runs client-side — no backend in v1.

## Requirements

- **HTTPS** (or `localhost`)
- Browser with **Web NFC** (typically Chrome on Android)

## Getting started

```bash
bun install
bun run start:nfc-back
```

Open `http://localhost:4205/` (NFC itself needs a supported mobile browser).

| Route | Description |
|-------|-------------|
| `/` | Landing + integration notes |
| `/nfc` | Reader (standalone without `returnUrl`) |
| `/demo-caller` | Minimal caller for manual E2E testing |

## Integration contract

### Open

```text
https://nfc-back.purified.app/nfc?returnUrl=<urlencoded-absolute-url>&state=<optional>
```

### Return after a successful read

```text
<returnUrl>?nfcValue=<value>&recordType=<type>&format=nfc&state=<state>
```

On cancel: `error=cancelled` (+ `state` if set).
