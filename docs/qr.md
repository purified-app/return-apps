# QR

Generate a QR code as SVG. Contract **v1**: `value` is an SVG data URL + `format=qr.svg`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:qr   # http://localhost:4208/
```

Live: https://return.purified.app/qr/ · `/qr/home` · `/qr/demo-caller`

## Open params

| Param | Description |
|-------|-------------|
| `text` | Optional seed text/URL to encode |

## Open / return

```text
https://return.purified.app/qr?returnUrl=URL&allowedOrigins=ORIGIN&state=S&text=hello
```

Success: `?value=<svg-data-url>&format=qr.svg&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('qr', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { text: 'https://example.com' },
});
const { value, format, error } = parseReturnResult(location);
```
