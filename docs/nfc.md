# NFC

Web NFC reader **and writer**. Contract **v1**: `value` + `format=nfc.<recordType>` + `recordType` (write success uses `nfc.written`). Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:nfc   # http://localhost:4205/
```

Live: https://return.purified.app/nfc/ · `/nfc/home` · `/nfc/demo-caller`

## Requirements

Chrome on **Android**, **HTTPS**.

## Open params

| Param | Description |
|-------|-------------|
| `mode` | `read` \| `write` — locks the UI when set |
| `text` | Payload to write in write mode |

## Open / return

```text
https://return.purified.app/nfc?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success: `?value=<payload>&format=nfc.url&recordType=url&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('nfc', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, extras, error } = parseReturnResult(location);
```
