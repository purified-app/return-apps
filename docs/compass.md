# Compass

Compass heading **measuring tool** (and returnUrl helper). Contract **v1**: `value` + `format=compass.heading`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

Previously a mode inside Level. `openReturnApp('level', { params: { mode: 'compass' } })` still works: Level redirects to `/compass/` when the path contains `/level`.

## Quick start

```bash
bun run start:compass   # http://localhost:4209/
```

Live: https://return.purified.app/compass/ · `/compass/home` · `/compass/demo-caller`

## As a tool

- Live heading with Hold (freeze) and Copy
- Desktop / no-sensor fallback: heading slider
- iOS: tap **Enable sensors**

## Open / return

```text
https://return.purified.app/compass?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success: `?value=42.5&format=compass.heading&mode=compass&heading=42.5&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('compass', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, extras, error } = parseReturnResult(location);
```
