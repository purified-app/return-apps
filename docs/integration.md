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
| `map` | `/map/` | query | `map.point` | `lat,lng` |
| `pin` | `/pin/` | **hash** | `pin.digits` | digit string |
| `nfc` | `/nfc/` | query | `nfc.<recordType>` | tag payload |
| `color` | `/color/` | query | `color.hex` | `#rrggbb` |
| `orient` | `/orient/` | query | `orient.compass` / `orient.level` / `orient.incline` | heading° / `pitch,roll` / incline° |

Live docs + demo caller per app: `https://return.purified.app/<id>/home` and `…/demo-caller`.

---

## Per-app open params & extras

### sign
- Open: (none beyond common)
- Return extras: none
- Notes: oversized signatures stay in-app (no redirect)

### scan
- Open: `formats` (optional comma list)
- Return extras: none (`format` carries barcode type)

### geo
- Open: `highAccuracy` (`false`/`0` to disable)
- Return extras: `lat`, `lng`, `accuracy`, `timestamp`, optional `altitude`, `altitudeAccuracy`, `heading`, `speed`
- Notes: with `returnUrl` set, success auto-returns

### map
- Open: optional `lat`, `lng`, `zoom` (initial view)
- Return extras: `lat`, `lng`, `zoom`

### pin
- Open: `length` (3–12, default 4), `mask` (`false`/`0` = show digits)
- Return extras: none

### nfc
- Open: (none)
- Return extras: `recordType`
- Notes: Chrome/Android + HTTPS (Web NFC)

### color
- Open: (none)
- Return extras: `rgb` as `r,g,b`
- Notes: needs camera permission

### orient
- Open: `mode` (`compass` \| `level` \| `incline`), `threshold` (level tolerance°, default 2)
- Return extras: `mode`, optional `heading`, `pitch`, `roll`, `incline`; level adds `withinThreshold`, `threshold`
- Notes: uses DeviceOrientation; manual sliders when sensors are unavailable

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
https://return.purified.app/orient?returnUrl=URL&allowedOrigins=ORIGIN&state=S&mode=compass
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
- Device limits: `nfc` needs Android Chrome; `scan`/`color` need camera; `geo` needs geolocation permission; `orient` needs device orientation (manual fallback on desktop).
