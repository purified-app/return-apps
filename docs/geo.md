# Geo

GPS helper. Contract **v1**: `value=<lat>,<lng>` + `format=geo.point`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:geo   # http://localhost:4202/
```

Live: https://return.purified.app/geo/ · `/geo/home` · `/geo/demo-caller`

## Open params

| Param | Description |
|-------|-------------|
| `highAccuracy` | `false` / `0` to disable |

## Return extras

`lat`, `lng`, `accuracy`, `timestamp`, optional `altitude`, `altitudeAccuracy`, `heading`, `speed`, `label` (street address when reverse geocode succeeds)

`label` comes from the public [Nominatim](https://nominatim.org/release-docs/latest/api/Reverse/) API (OpenStreetMap). It is best-effort: Geo waits up to ~2.5s, then returns coordinates even if there is no address. The request runs **in the user’s browser** (their IP), not from our servers. Nominatim is free; policy is roughly **1 request/second per client IP**. Abuse can get that IP (or the app referer) temporarily blocked — not a paid quota on `return.purified.app`.

## Open / return

```text
https://return.purified.app/geo?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success: `?value=59.91,10.75&format=geo.point&lat=…&lng=…&accuracy=…&timestamp=…&state=S`

With `returnUrl` set, a successful reading auto-returns.

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('geo', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, extras, error } = parseReturnResult(location);
```
