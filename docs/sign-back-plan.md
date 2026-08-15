# SignBack — signature pad with redirect return

Sibling utility to ScanBack. Client-side Angular app that captures a signature and redirects it back to a calling web app via URL.

## Product goal

1. Fullscreen-friendly signature pad (pointer/touch)
2. Opened from other web apps with `returnUrl` + optional `state`
3. On Done: redirect with `signature` (SVG data URL) + `format=image/svg+xml`
4. No backend in v1

## Domain

- App: **https://sign-back.purified.app**
- GitHub repo: **purified-app/sign-back**
- Pages + CNAME + SPA `404.html`

## Routes

- `/` landing + docs
- `/sign` pad
- `/demo-caller` E2E caller

## Acceptance

- Draw → Done → redirect includes `signature` + `format` + `state`
- Cancel → `error=cancelled`
- Invalid `returnUrl` → error, no redirect
- `ng build` succeeds
- Deploys to GitHub Pages
