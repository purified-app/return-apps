# Scan

Camera barcode scanner. Contract **v1**: `value` + `format=scan.<type>` (e.g. `scan.qr_code`). Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:scan   # http://localhost:4201/
```

Live: https://return.purified.app/scan/ · `/scan/home` · `/scan/demo-caller`

## Open params

| Param | Description |
|-------|-------------|
| `formats` | Optional comma-separated barcode formats |
| `batch` | `true` / `1` — accumulate codes, then Done returns `format=scan.batch` |

## Open / return

```text
https://return.purified.app/scan?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success: `?value=<payload>&format=scan.qr_code&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('scan', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, format, error } = parseReturnResult(location);
```

Needs camera permission. Uses Barcode Detection API + `barcode-detector` ponyfill.
