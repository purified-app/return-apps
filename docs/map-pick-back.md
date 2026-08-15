# MapPickBack

Leaflet map pin picker. Contract **v1**: `value=<lat>,<lng>` + `format=map.point`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:map-pick-back   # http://localhost:4203/
```

Live: https://return.purified.app/map/ · `/map/home` · `/map/demo-caller`

## Open params

| Param | Description |
|-------|-------------|
| `lat`, `lng`, `zoom` | Optional initial map view |

## Return extras

`lat`, `lng`, `zoom`

## Open / return

```text
https://return.purified.app/map?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success: `?value=59.91,10.75&format=map.point&lat=…&lng=…&zoom=…&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('map', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, extras, error } = parseReturnResult(location);
```
