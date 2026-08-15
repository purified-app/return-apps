# Integration contract v1

Shared by all return-apps. No SDK — call with plain URLs.

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

## Caller example

```js
const returnUrl = location.href;
location.href =
  'https://return.purified.app/pin' +
  `?returnUrl=${encodeURIComponent(returnUrl)}` +
  `&allowedOrigins=${encodeURIComponent(location.origin)}` +
  '&state=order-42';

// After redirect back:
const raw =
  location.hash.startsWith('#') && !location.hash.startsWith('#/')
    ? location.hash.slice(1)
    : location.search.slice(1);
const params = new URLSearchParams(raw);
const value = params.get('value');
const format = params.get('format');
const error = params.get('error');
```
