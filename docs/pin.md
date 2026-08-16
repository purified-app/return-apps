# Pin

Numeric PIN pad. Contract **v1**: `value` + `format=pin.digits`. Default delivery: **hash**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:pin   # http://localhost:4204/
```

Live: https://return.purified.app/pin/ · `/pin/home` · `/pin/demo-caller`

## Open params

| Param | Description |
|-------|-------------|
| `length` | 3–12 (default `4`) |
| `mask` | `false` / `0` to show digits |

## Open / return

```text
https://return.purified.app/pin?returnUrl=URL&allowedOrigins=ORIGIN&state=S&length=4
```

Success (hash): `#value=1234&format=pin.digits&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('pin', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { length: 4 },
});
const { value, error } = parseReturnResult(location);
```
