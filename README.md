# return-apps

Angular workspace for **returnUrl** helper apps — small client-side tools that capture something (signature, scan, …) and redirect the result back to a calling app.

## Apps

| App | Path | Local | Production |
|-----|------|-------|------------|
| **SignBack** | `projects/sign-back` | `bun run start:sign-back` → http://localhost:4200 | https://sign-back.purified.app |
| **ScanBack** | `projects/scan-back` | `bun run start:scan-back` → http://localhost:4201 | https://scan-back.purified.app |

Shared library: **`shared-ui`** (`projects/shared-ui`) — styles, `ReturnUrlValidator`, `appBaseUrl`, `RbPanel`, `RbMetaList`, `RbPage`.

Per-app docs: [docs/sign-back.md](docs/sign-back.md), [docs/scan-back.md](docs/scan-back.md).

## Requirements

- [Bun](https://bun.sh) **1.3+**
- Node.js **22.22+** (used by the Angular toolchain)

## Getting started

```bash
bun install
bun run start:sign-back   # or start:scan-back
```

## Scripts

| Script | Description |
|--------|-------------|
| `bun run start:sign-back` | Serve SignBack on :4200 |
| `bun run start:scan-back` | Serve ScanBack on :4201 |
| `bun run build` | Build shared-ui + both apps |
| `bun run build:shared-ui` | Build the shared library |
| `bun run build:sign-back` | Production build of SignBack → `dist/sign-back/browser` |
| `bun run build:scan-back` | Production build of ScanBack → `dist/scan-back/browser` |
| `bun run test` | Unit tests for lib + both apps |

## Workspace layout

```text
return-apps/
  projects/
    shared-ui/     # shared styles + UI + returnUrl helpers
    sign-back/     # signature pad → returnUrl
    scan-back/     # QR/barcode scanner → returnUrl
  docs/
  angular.json
```

## Deploy

Each app keeps its own custom domain. Because GitHub Pages is one site per repo, production builds are published to the legacy app repos’ `gh-pages` branches:

| App | Deploy workflow | Target |
|-----|-----------------|--------|
| SignBack | `.github/workflows/deploy-sign-back.yml` | `purified-app/sign-back` → `gh-pages` |
| ScanBack | `.github/workflows/deploy-scan-back.yml` | `purified-app/scan-back` → `gh-pages` |

### One-time setup

1. Add a repo secret **`DEPLOY_GITHUB_TOKEN`** on `return-apps` (PAT or fine-grained token with `contents: write` on `sign-back` and `scan-back`).
2. In each legacy repo → **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **`gh-pages`** / `/` (root)
   - Custom domain unchanged (`sign-back.purified.app` / `scan-back.purified.app`)
3. Push to `main` (or run the workflow manually). Path filters deploy only the app that changed.

CI builds and tests `shared-ui`, `sign-back`, and `scan-back` on every push/PR to `main`.

## Stack

- Bun (package manager)
- Angular 22 (standalone, signals)
- SignBack: canvas → SVG data URL
- ScanBack: ZXing (`@zxing/browser` + `@zxing/library`)
- GitHub Actions
