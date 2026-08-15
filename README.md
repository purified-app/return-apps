# return-apps

Angular workspace for **returnUrl** helper apps — small client-side tools that capture something (signature, scan, …) and redirect the result back to a calling app.

## Apps

| App | Path | Local | Production |
|-----|------|-------|------------|
| **SignBack** | `projects/sign-back` | `npm run start:sign-back` → http://localhost:4200 | https://sign-back.purified.app |
| **ScanBack** | `projects/scan-back` | `npm run start:scan-back` → http://localhost:4201 | https://scan-back.purified.app |

Per-app docs: [docs/sign-back.md](docs/sign-back.md), [docs/scan-back.md](docs/scan-back.md).

## Requirements

- Node.js **22.22+** (Angular 22)
- npm 10+

## Getting started

```bash
npm install
npm run start:sign-back   # or start:scan-back
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:sign-back` | Serve SignBack on :4200 |
| `npm run start:scan-back` | Serve ScanBack on :4201 |
| `npm run build` | Production build of both apps |
| `npm run build:sign-back` | Production build of SignBack → `dist/sign-back/browser` |
| `npm run build:scan-back` | Production build of ScanBack → `dist/scan-back/browser` |
| `npm test` | Unit tests for both apps |

## Workspace layout

```text
return-apps/
  projects/
    sign-back/     # signature pad → returnUrl
    scan-back/     # QR/barcode scanner → returnUrl
  styles/          # shared design tokens + UI (buttons, home/demo/panel)
  docs/            # per-app READMEs / plans
  angular.json     # both projects
```

Created with:

```bash
npx @angular/cli@22 new return-apps --create-application=false
npx ng generate application sign-back --routing --style=scss --ssr=false
npx ng generate application scan-back --routing --style=scss --ssr=false
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

CI (`.github/workflows/ci.yml`) builds and tests both apps on every push/PR to `main`.

## Stack

- Angular 22 (standalone, signals)
- SignBack: canvas → SVG data URL
- ScanBack: ZXing (`@zxing/browser` + `@zxing/library`)
- GitHub Actions
