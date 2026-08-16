# Level

Compass / spirit level / incline **measuring tool** (and returnUrl helper). Contract **v1**: `value` + `format=level.*`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:level   # http://localhost:4207/
```

Live: https://return.purified.app/level/ · `/level/home` · `/level/demo-caller`

Legacy `/orient/` URLs redirect to `/level/`. The SDK still accepts `openReturnApp('orient', …)` as an alias.

## As a tool

- Live readout with Hold (freeze), Copy, and Incline **Tare**
- Level turns green + short vibrate when within threshold
- Screen wake lock while sensors are active (when supported)
- Desktop / no-sensor fallback: mode-specific manual sliders
- iOS: tap **Enable sensors** (permission requires a user gesture)

## Modes

| `mode` | `format` | `value` | Primary readout |
|--------|----------|---------|-----------------|
| `compass` | `level.compass` | heading `0–360` | heading° + cardinal |
| `level` | `level.level` | `pitch,roll` | max deviation° |
| `incline` | `level.incline` | degrees from horizontal (after tare) | incline° |

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
https://return.purified.app/level?returnUrl=URL&allowedOrigins=ORIGIN&state=S&mode=level&requireLevel=1
```

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('level', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { mode: 'level', threshold: 2, requireLevel: true },
});
const { value, format, extras, error } = parseReturnResult(location);
```
