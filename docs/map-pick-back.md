# MapPickBack

Leaflet map pin picker. Contract **v1**: `value=<lat>,<lng>` + `format=map.point` plus `lat`, `lng`, `zoom`. Default delivery: **query**.

See [contract-v1.md](./contract-v1.md).

```bash
bun run start:map-pick-back   # :4203
```

Optional open params: `lat`, `lng`, `zoom` (initial view).
