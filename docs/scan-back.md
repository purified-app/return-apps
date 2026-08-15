# ScanBack

Camera barcode scanner. Contract **v1**: `value` + `format=scan.<type>` (e.g. `scan.qr_code`). Default delivery: **query**.

See [contract-v1.md](./contract-v1.md).

```bash
bun run start:scan-back   # :4201
```

Optional open param: `formats` (comma list). Uses Barcode Detection API with `barcode-detector` ponyfill.
