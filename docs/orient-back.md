# OrientBack

Compass / spirit level / incline **measuring tool** (and returnUrl helper). Contract **v1**: `value` + `format=orient.*`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:orient-back   # http://localhost:4207/
```

Live: https://return.purified.app/orient/ · `/orient/home` · `/orient/demo-caller`

## As a tool

- Live readout with Hold (freeze), Copy, and Incline **Tare**
- Level turns green when within threshold
- Desktop / no-sensor fallback: mode-specific manual sliders
- iOS: tap **Enable sensors** (permission requires a user gesture)

## Modes

| `mode` | `format` | `value` | Primary readout |
|--------|----------|---------|-----------------|
| `compass` | `orient.compass` | heading `0–360` | heading° + cardinal |
| `level` | `orient.level` | `pitch,roll` | max deviation° |
| `incline` | `orient.incline` | degrees from horizontal (after tare) | incline° |

## Open params

| Param | Description |
|-------|-------------|
| `mode` | `compass` \| `level` \| `incline` — locks the UI when set |
| `threshold` | Level tolerance in degrees (default `2`) |
| `requireLevel` | `true` / `1` — confirm only when within level threshold |

## Return extras

`mode`, optional `heading`, `pitch`, `roll`, `incline`, `tare`; level also returns `withinThreshold`, `threshold`, `deviation`.

## Open / return

```text
https://return.purified.app/orient?returnUrl=URL&allowedOrigins=ORIGIN&state=S&mode=level&requireLevel=1
```

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('orient', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { mode: 'level', threshold: 2, requireLevel: true },
});
const { value, format, extras, error } = parseReturnResult(location);
```
