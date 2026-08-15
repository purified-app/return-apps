# PinBack

> Lives in the `return-apps` monorepo under `projects/pin-back`.

Numeric PIN keypad. Returns digits via contract **v1** (`value` + `format=pin.digits`). Default delivery: **hash**.

See [contract-v1.md](./contract-v1.md).

## Getting started

```bash
bun install
bun run start:pin-back
```

Open `http://localhost:4204/`.

## App-specific open params

| Param | Description |
|-------|-------------|
| `length` | PIN length 3–12 (default `4`) |
| `mask` | `false` / `0` to show digits |

Success (hash): `#value=<digits>&format=pin.digits&state=…`
