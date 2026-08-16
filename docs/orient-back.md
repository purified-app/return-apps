# OrientBack

Device orientation helper (compass / spirit level / incline). Contract **v1**: `value` + `format=orient.*`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:orient-back   # http://localhost:4207/
```

Live: https://return.purified.app/orient/ · `/orient/home` · `/orient/demo-caller`

## Modes

| `mode` | `format` | `value` |
|--------|----------|---------|
| `compass` (default UI) | `orient.compass` | heading degrees `0–360` |
| `level` | `orient.level` | `pitch,roll` degrees |
| `incline` | `orient.incline` | degrees from horizontal |

## Open params

| Param | Description |
|-------|-------------|
| `mode` | `compass` \| `level` \| `incline` — locks the UI when set |
| `threshold` | Level tolerance in degrees (default `2`) |

## Return extras

`mode`, optional `heading`, `pitch`, `roll`, `incline`; level also returns `withinThreshold`, `threshold`.

## Open / return

```text
https://return.purified.app/orient?returnUrl=URL&allowedOrigins=ORIGIN&state=S&mode=compass
```

Success (compass): `?value=42.5&format=orient.compass&mode=compass&heading=42.5&state=S`

Success (level): `?value=0.2,-0.4&format=orient.level&mode=level&pitch=0.2&roll=-0.4&withinThreshold=true&threshold=2`

On desktop (no sensors), OrientBack falls back to manual sliders so callers/demos still work.

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('orient', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { mode: 'level', threshold: 2 },
});
const { value, format, extras, error } = parseReturnResult(location);
```
