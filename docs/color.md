# Color

Camera eyedropper. Contract **v1**: `value=#rrggbb` + `format=color.hex` + `rgb`. Default delivery: **query**.

See **[integration.md](./integration.md)**.

## Quick start

```bash
bun run start:color   # http://localhost:4206/
```

Live: https://return.purified.app/color/ · `/color/home` · `/color/demo-caller`

## Requirements

Camera permission; HTTPS or localhost.

## Open / return

```text
https://return.purified.app/color?returnUrl=URL&allowedOrigins=ORIGIN&state=S
```

Success: `?value=%23c45c26&format=color.hex&rgb=196,92,38&state=S`

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';
location.href = openReturnApp('color', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
});
const { value, extras, error } = parseReturnResult(location);
// value = "#c45c26", extras.rgb = "196,92,38"
```
