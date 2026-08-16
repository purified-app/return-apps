# Integration contract v1

Full guide (humans + AI agents): **[integration.md](./integration.md)**  
Catalog: [`../site/apps.json`](../site/apps.json) · Agent index: [`../site/llms.txt`](../site/llms.txt) · SDK: [`../site/sdk/return-apps.mjs`](../site/sdk/return-apps.mjs)

## Open

```text
https://return.purified.app/<app>?returnUrl=<url>&allowedOrigins=<origins>&state=<optional>&delivery=<query|hash>
```

| Param | Required | Description |
|-------|----------|-------------|
| `returnUrl` | for return mode | Absolute `https:` (or `http://localhost` / `127.0.0.1` / `::1`) |
| `allowedOrigins` | recommended | Comma-separated origins; when set, `returnUrl` must match |
| `state` | no | Echoed on return |
| `delivery` | no | `query` (default) or `hash` (**default for pin + sign**) |

## Return

| Param | Description |
|-------|-------------|
| `value` | Primary payload — **always use this** |
| `format` | `sign.svg` · `pin.digits` · `geo.point` · `map.point` · `map.distance` · `map.area` · `color.hex` · `orient.compass` · `orient.level` · `orient.incline` · `scan.*` · `nfc.*` |
| `error` | `cancelled` on cancel |
| `state` | Echo |

Hash delivery puts params in the URL fragment. **Pin/sign → parse hash** (or use the SDK).

## SDK (recommended)

```js
import { openReturnApp, parseReturnResult } from 'https://return.purified.app/sdk/return-apps.mjs';

location.href = openReturnApp('pin', {
  returnUrl: location.href,
  allowedOrigins: [location.origin],
  state: 'order-42',
});

const { value, format, error } = parseReturnResult(location);
```

## Anti-patterns

- Reading only `location.search` after pin/sign (misses hash results)
- Using legacy keys (`pin`, `signature`, `scanValue`, …) instead of `value`
- Omitting `allowedOrigins` on real origins
- Expecting `postMessage` (not supported)
