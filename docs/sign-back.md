# SignBack

> Lives in the `return-apps` monorepo under `projects/sign-back`.

Mobile-first signature pad. Returns SVG via contract **v1** (`value` + `format=sign.svg`). Default delivery: **hash**.

See [contract-v1.md](./contract-v1.md) for shared open/return rules.

## Getting started

```bash
bun install
bun run start:sign-back
```

Open `http://localhost:4200/`.

| Route | Description |
|-------|-------------|
| `/` | Signature pad |
| `/home` | Landing + integration notes |
| `/demo-caller` | Minimal caller for manual E2E |

## App-specific

```text
https://return.purified.app/sign?returnUrl=…&allowedOrigins=…&delivery=hash&state=…
```

Success (hash): `#value=<svg-data-url>&format=sign.svg&state=…`

Signatures that are too large for URL delivery stay in-app with an error (simplify strokes).
