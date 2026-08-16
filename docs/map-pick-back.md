# MapPickBack

Leaflet map with **Pick / Measure / Area** tabs. Contract **v1**. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:map-pick-back   # http://localhost:4203/
```

Live: https://return.purified.app/map/ · `/map/home` · `/map/demo-caller`

## Modes

| Mode | UI | Success `format` | `value` |
|------|----|------------------|---------|
| `pick` (default) | Single draggable pin | `map.point` | `lat,lng` |
| `measure` | Multi-point path with segment + total distance | `map.distance` | meters (number string) |
| `area` | Polygon with live area + perimeter | `map.area` | square meters (number string) |

Pass `mode=pick|measure|area` to lock the tab (same pattern as OrientBack).

Measure/Area also support **Undo**, **Add my location** (appends GPS as a vertex), and **Save image** (downloads an SVG snapshot of the geometry + stats).

## Open params

| Param | Description |
|-------|-------------|
| `lat`, `lng`, `zoom` | Optional initial map view |
| `mode` | Optional: `pick` \| `measure` \| `area` (locks UI) |

## Return extras

- **pick:** `lat`, `lng`, `zoom`
- **measure:** `mode`, `meters`, `points` (`lat,lng;…`), `pointCount`
- **area:** `mode`, `squareMeters`, `perimeterMeters`, `points`, `pointCount`

## Open / return

```text
https://return.purified.app/map?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/map?returnUrl=URL&allowedOrigins=ORIGIN&mode=measure
```

Success (pick): `?value=59.91,10.75&format=map.point&lat=…&lng=…&zoom=…&state=S`  
Success (measure): `?value=1234.5&format=map.distance&meters=1234.5&points=…&mode=measure`  
Success (area): `?value=5000.2&format=map.area&squareMeters=5000.2&perimeterMeters=…&points=…&mode=area`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('map', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { mode: 'measure' },
});
const { value, format, extras, error } = parseReturnResult(location);
```
