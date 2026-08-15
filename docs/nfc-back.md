# NfcBack

Web NFC reader (Chrome/Android). Contract **v1**: `value` + `format=nfc.<recordType>` plus `recordType`. Default delivery: **postMessage** (hash fallback).

See [contract-v1.md](./contract-v1.md).

```bash
bun run start:nfc-back   # :4205
```

Demo caller forces `delivery=hash` because it navigates in the same tab.
