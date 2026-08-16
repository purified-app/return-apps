# Sign

Signature pad → SVG. Contract **v1**: `value` + `format=sign.svg`. Default delivery: **hash**.

See **[integration.md](./integration.md)** (canonical) and [contract-v1.md](./contract-v1.md).

## Quick start

```bash
bun run start:sign   # http://localhost:4200/
```

Live: https://return.purified.app/sign/ · docs `/sign/home` · demo `/sign/demo-caller`

## Open / return

```text
https://return.purified.app/sign?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success (hash): `#value=<svg-data-url>&format=sign.svg&state=S`  
Cancel: `#error=cancelled&state=S` (or query if `delivery=query`)

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('sign', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, format, error } = parseReturnResult(location);
// value is data:image/svg+xml;…
```

Oversized signatures stay in-app (no redirect) — simplify strokes.
