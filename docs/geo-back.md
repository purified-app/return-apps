# GeoBack

GPS helper. Contract **v1**: `value=<lat>,<lng>` + `format=geo.point` plus `lat`, `lng`, `accuracy`, `timestamp` (and optional altitude/heading/speed). Default delivery: **query**.

See [contract-v1.md](./contract-v1.md).

```bash
bun run start:geo-back   # :4202
```

Optional: `highAccuracy=false`.
