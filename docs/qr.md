# QR

Generate a QR code. Contract **v1**: `value` is a data URL + `format=qr.svg` (default) or `format=qr.png`. Default delivery: **query** for SVG, **hash** for PNG (payloads are large). Standalone (no `returnUrl`) can copy the SVG and download **SVG** or **PNG**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:qr   # http://localhost:4208/
```

Live: https://return.purified.app/qr/ · `/qr/home` · `/qr/demo-caller`

## Open params

| Param | Description |
|-------|-------------|
| `text` | Optional seed text/URL to encode |
| `output` | `svg` (default) or `png` — return format when using `returnUrl` |
| `auto` | `1` / `true` — skip the editor when `text` is set: redirect back, or download PNG if there is no `returnUrl` |

## Open / return

```text
https://return.purified.app/qr?returnUrl=URL&allowedOrigins=ORIGIN&state=S&text=hello
https://return.purified.app/qr?returnUrl=URL&allowedOrigins=ORIGIN&state=S&text=hello&output=png&auto=1
```

Success (SVG): `?value=<svg-data-url>&format=qr.svg&state=S`  
Success (PNG): `#value=<png-data-url>&format=qr.png&state=S` — parse the hash (or use the SDK).

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('qr', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  params: { text: 'https://example.com', output: 'png', auto: 1 },
});
const { value, format, error } = parseReturnResult(location);
```

## Bulk / server (do not loop this app)

There is **no HTTP API** that returns PNG bytes. Generation runs in the browser. Driving `/qr/` in a loop (or putting PNG data URLs in `returnUrl`) is a poor fit for hundreds of codes.

Generate files on the server with the same library we use (`uqr`):

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { renderSVG } from 'uqr';

const items = [
  ['ticket-1', 'https://example.com/t/1'],
  ['ticket-2', 'https://example.com/t/2'],
];

await mkdir('qr-out', { recursive: true });
for (const [name, text] of items) {
  const svg = renderSVG(text, {
    border: 2,
    ecc: 'M',
    pixelSize: 8,
    whiteColor: '#ffffff',
    blackColor: '#0f1418',
  });
  await writeFile(`qr-out/${name}.svg`, svg);
}
```

SVG scans fine. For PNG, rasterize locally (e.g. [`sharp`](https://sharp.pixelplumbing.com/)):

```js
import sharp from 'sharp';
await sharp(Buffer.from(svg)).png().toFile(`qr-out/${name}.png`);
```
