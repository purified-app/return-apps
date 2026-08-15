# Integration contract v1

All return-apps share one contract. Breaking changes bump `contractVersion` in [`site/apps.json`](../site/apps.json).

## Open

```text
https://return.purified.app/<app>?returnUrl=<url>&state=<optional>&allowedOrigins=<origins>&delivery=<mode>&v=1
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` callback (or `http://localhost` / `127.0.0.1` / `::1`) |
| `state` | no | Opaque string echoed on return |
| `allowedOrigins` | recommended | Comma-separated origins; when set, `returnUrl` must match one of them |
| `delivery` | no | `query` (default for most) · `hash` (default for **sign** / **pin**) · `postMessage` (default for **nfc**) |
| `v` | no | Contract version (`1`) |

App-specific open params (e.g. `length`, `formats`) are unchanged per app docs.

## Success return

Primary payload is always:

| Param | Description |
|-------|-------------|
| `value` | Primary result |
| `format` | Canonical tag (`sign.svg`, `pin.digits`, `geo.point`, `map.point`, `color.hex`, `scan.*`, `nfc.*`) |
| `state` | Echo |

Extras may accompany `value` (`lat`/`lng`, `rgb`, `recordType`, …). See [`apps.json`](../site/apps.json).

### Delivery

- **query** — params on `returnUrl` search (or inside `#/…?` for hash routers)
- **hash** — params in the URL fragment (`#value=…`) so they are not sent as Referer/query logs
- **postMessage** — `{ source: 'return-apps', version: 1, value, format, state, … }` to `opener`/`parent`; falls back to hash redirect

## Errors

| `error` | Meaning |
|---------|---------|
| `cancelled` | User cancelled |
| `denied` | Permission denied (when redirected) |
| `unsupported` | API unavailable |
| `timeout` | Timed out |
| `too_large` | Payload too large for URL delivery |
| `failed` | Other failure |

## SDK

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';

location.href = openReturnApp('pin', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  state: 'order-42',
});

const result = parseReturnResult(location);
```

Catalog: `https://return.purified.app/apps.json`
