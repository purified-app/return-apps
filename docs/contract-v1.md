# Integration contract v1

Shared by all return-apps. Catalog: [`site/apps.json`](../site/apps.json). SDK: [`site/sdk/return-apps.mjs`](../site/sdk/return-apps.mjs).

## Open

```text
https://return.purified.app/<app>?returnUrl=<url>&state=<optional>&allowedOrigins=<origins>&delivery=<query|hash>
```

| Param | Description |
|-------|-------------|
| `returnUrl` | Absolute `https:` callback (`http://localhost` / `127.0.0.1` / `::1` ok) |
| `state` | Echoed on return |
| `allowedOrigins` | Comma-separated origins; when set, `returnUrl` must match |
| `delivery` | `query` (default) or `hash` (default for **pin** / **sign**) |

## Return

| Param | Description |
|-------|-------------|
| `value` | Primary payload |
| `format` | `sign.svg`, `pin.digits`, `geo.point`, `map.point`, `color.hex`, `scan.*`, `nfc.*` |
| `error` | e.g. `cancelled` |
| `state` | Echo |

Extras (`lat`, `rgb`, …) may accompany `value`. Hash delivery puts params in the fragment.

## SDK

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';

location.href = openReturnApp('pin', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  state: 'order-42',
});

const { value, format, error } = parseReturnResult(location);
```
