# Integrating return-apps (for developers & AI agents)

**Canonical contract:** [contract-v1.md](./contract-v1.md)  
**Machine-readable catalog:** https://return.purified.app/apps.json  
**Agent index:** https://return.purified.app/llms.txt  
**SDK:** https://return.purified.app/sdk/return-apps.mjs  

Base URL: `https://return.purified.app`

These are small web apps. A caller opens one with query params, the user does one action, then the helper redirects back to `returnUrl` with the result.

---

## Rules (always)

1. Always send an absolute `returnUrl` (`https:` — or `http://localhost` / `127.0.0.1` / `::1` for local).
2. Always send `allowedOrigins` set to the caller’s origin in production-like use.
3. Always read **`value`** + **`format`** on success (not legacy names like `pin` / `signature` / `scanValue`).
4. On cancel, expect `error=cancelled` (and echoed `state` if you sent one).
5. **Pin + Sign default to `delivery=hash`.** Results are in `location.hash`, not `location.search`. Prefer the SDK parser, or parse both.
6. Do not invent return field names. Use the catalog below.

### Prefer the SDK

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';

location.href = openReturnApp('pin', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  state: 'order-42',
  // params: { length: 6 },
});

// After the helper redirects back to this page:
const { value, format, error, state, extras } = parseReturnResult(location);
if (error) { /* cancelled, etc. */ }
else { /* use value + format */ }
```

### Plain URL (no SDK)

```js
const returnUrl = location.href;
const qs = new URLSearchParams({
  returnUrl,
  allowedOrigins: location.origin,
  state: 'order-42',
});
location.href = `https://return.purified.app/pin?${qs}`;

// On return — MUST handle hash for pin/sign:
function readParams(loc = location) {
  const hash = loc.hash.startsWith('#') ? loc.hash.slice(1) : '';
  const hashQuery = hash.includes('?')
    ? hash.slice(hash.indexOf('?') + 1)
    : hash.startsWith('/') ? '' : hash;
  return new URLSearchParams({
    ...Object.fromEntries(new URLSearchParams(hashQuery)),
    ...Object.fromEntries(loc.searchParams),
  });
}
const params = readParams();
const value = params.get('value');
const format = params.get('format');
const error = params.get('error');
```

---

## App catalog

| id | Path | Default delivery | Success `format` | `value` meaning |
|----|------|------------------|------------------|-----------------|
| `sign` | `/sign/` | **hash** | `sign.svg` | SVG data URL |
| `scan` | `/scan/` | query | `scan.<type>` e.g. `scan.qr_code` | scanned text |
| `geo` | `/geo/` | query | `geo.point` | `lat,lng` |
| `map` | `/map/` | query | `map.point` / `map.distance` / `map.area` | `lat,lng` / meters / m² |
| `pin` | `/pin/` | **hash** | `pin.digits` | digit string |
| `nfc` | `/nfc/` | query | `nfc.<recordType>` / `nfc.written` | tag payload |
| `color` | `/color/` | query | `color.hex` | `#rrggbb` |
| `level` | `/level/` | query | `level.level` / `level.incline` | `pitch,roll` / incline° |
| `qr` | `/qr/` | query (hash if `output=png`) | `qr.svg` / `qr.png` | SVG or PNG data URL |
| `compass` | `/compass/` | query | `compass.heading` | heading° |

`orient` is an SDK alias for `level` (`openReturnApp('orient', …)` opens `/level/`). Legacy `/orient/` URLs redirect to `/level/`. Formats were renamed from `orient.*` to `level.*`. `mode=compass` on Level redirects to Compass (`compass.heading`).

Live docs + demo caller per app: `https://return.purified.app/<id>/home` and `…/demo-caller`.

---

## Per-app open params & extras

### sign
- Open: (none beyond common)
- Return extras: none
- Notes: oversized signatures stay in-app (no redirect)

### scan
- Open: `formats` (optional comma list), `batch` (`true`/`1` to accumulate codes)
- Return extras: none for a single scan (`format` carries barcode type). Batch returns `format=scan.batch`, `value` as a JSON string array, extra `count`.

### geo
- Open: `highAccuracy` (`false`/`0` to disable)
- Return extras: `lat`, `lng`, `accuracy`, `timestamp`, optional `altitude`, `altitudeAccuracy`, `heading`, `speed`, `label` (Nominatim reverse-geocode when available)
- Notes: with `returnUrl` set, success auto-returns (waits briefly for `label`)

### map
- Open: optional `lat`, `lng`, `zoom` (initial view), `mode` (`pick` \| `measure` \| `area` — locks UI when set), `units` (`metric` \| `imperial` — display only)
- Return extras:
  - pick (`map.point`): `lat`, `lng`, `zoom`
  - measure (`map.distance`): `mode`, `meters`, `points` (`lat,lng;…`), `pointCount`
  - area (`map.area`): `mode`, `squareMeters`, `perimeterMeters`, `points`, `pointCount`
- Notes: Measure/Area draw paths/polygons with live stats (area label centered on polygon); **Save image** exports a PNG of the map view (tiles + overlays); return values stay SI (meters / m²)

### pin
- Open: `length` (3–12, default 4), `mask` (`false`/`0` = show digits)
- Return extras: none

### nfc
- Open: `mode` (`read` \| `write`), `text` (write payload)
- Return extras: `recordType`
- Notes: Chrome/Android + HTTPS (Web NFC). Write returns `format=nfc.written`.

### color
- Open: `mode` (`camera` \| `palette`), `hex` (seed for palette)
- Return extras: `rgb` as `r,g,b`
- Notes: camera permission for camera mode; palette works on desktop without a camera

### level
- Open: `mode` (`level` \| `incline`), `threshold` (level tolerance°, default 2), `requireLevel` (`true`/`1` to require level before confirm)
- Return extras: `mode`, optional `heading`, `pitch`, `roll`, `incline`, `tare`; level adds `withinThreshold`, `threshold`, `deviation`
- Notes: measuring tool with Hold / Copy / Incline Tare; DeviceOrientation with manual fallback; iOS needs a tap to enable sensors. `mode=compass` redirects to the Compass app.

### qr
- Open: `text` (optional seed), `output` (`svg` \| `png`), `auto` (`true`/`1` to skip the editor when `text` is set)
- Return extras: none
- Notes: default `value` is an SVG data URL (`qr.svg`). `output=png` returns a PNG data URL (`qr.png`) and defaults to **hash** delivery. For bulk generation, do not loop this app — generate with `uqr` on the server (see [qr.md](./qr.md)).

### compass
- Open: (none beyond common)
- Return extras: `mode`, optional `heading`
- Notes: split out of Level; measuring tool with Hold / Copy; manual slider fallback

---

## Copy-paste open URLs

```text
https://return.purified.app/sign?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/scan?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/geo?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/map?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/pin?returnUrl=URL&allowedOrigins=ORIGIN&state=S&length=4
https://return.purified.app/nfc?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/color?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/level?returnUrl=URL&allowedOrigins=ORIGIN&state=S&mode=level
https://return.purified.app/qr?returnUrl=URL&allowedOrigins=ORIGIN&state=S
https://return.purified.app/compass?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Replace `URL` with `encodeURIComponent(absoluteReturnUrl)` and `ORIGIN` with `encodeURIComponent(location.origin)`.

---

## Errors

| `error` | Meaning |
|---------|---------|
| `cancelled` | User cancelled |
| (none, stay in helper) | Permission denied / unsupported device — user can retry or cancel |

Invalid `returnUrl` / `allowedOrigins` mismatch → helper shows an in-app error and does **not** redirect.

---

## Pitfalls for AI agents

- **Do not** read only `location.search` for pin/sign — check hash (or use `parseReturnResult`).
- **Do not** use old param names: `pin`, `signature`, `scanValue`, `nfcValue`, `hex` as the primary field — primary is always `value`.
- **Do not** omit `allowedOrigins` when calling from a real origin (open redirect risk).
- **Do not** assume `postMessage` — not supported; use redirect (`query` or `hash`).
- Local demos: `http://localhost:<port>` is allowed for `returnUrl`.
- Device limits: `nfc` needs Android Chrome; `scan`/`color` need camera (Color also has a palette); `geo` needs geolocation permission; `level`/`compass` need device orientation (manual fallback on desktop).
