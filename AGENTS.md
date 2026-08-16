You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Cursor Cloud specific instructions

### Toolchain

- Package manager is Bun (`bun@1.3.14`, pinned in `package.json`). The Angular CLI (v22) requires Node `>=22.22.3`; the base image's default `/exec-daemon/node` is too old, so the environment uses nvm's Node `22.23.2` (set as the nvm `default` alias) and `~/.bun/bin` on `PATH`. A fresh login shell resolves the correct `node`/`bun` automatically — no manual `nvm use` needed.
- Angular CLI analytics is disabled globally (`~/.angular-config.json`) so `ng`/`bun run` commands don't block on the first-run interactive analytics prompt. If a future run hits that `(y/N)` prompt, run `bunx ng analytics off --global` once.

### Services & running

- There is no backend. Each app (`sign-back`, `scan-back`, `geo-back`, `map-pick-back`, `pin-back`, `nfc-back`, `color-back`, `orient-back`) is a self-contained client-side Angular SPA. Serve one with `bun run start:<app>` (ports 4200–4207; see `README.md`). `shared-ui` is consumed from source via tsconfig path mappings, so it does NOT need to be prebuilt for `ng serve`.
- To exercise an app's core `returnUrl` flow in a browser, use its `/demo-caller` route (e.g. `http://localhost:4204/demo-caller` for `pin-back`), which simulates a calling app and shows the returned value.
- Some apps need device APIs that a headless/remote browser can't provide: `scan-back`/`color-back` need camera, `geo-back` needs geolocation, `nfc-back` needs Web NFC (Chrome/Android only), `orient-back` needs device orientation (falls back to manual sliders). `pin-back` and `sign-back` are the most deterministic to test in a browser.

### Integrating / calling these apps (humans & AI agents)

When writing code that **opens** a return-app from another web app, follow **`docs/integration.md`** (canonical). Short rules:

- Success is always `value` + `format` (+ `state`). Cancel is `error=cancelled`.
- Prefer SDK: `site/sdk/return-apps.mjs` → `openReturnApp` / `parseReturnResult`.
- **pin** and **sign** default to `delivery=hash` — do not parse only `location.search`.
- Always pass `allowedOrigins` with the caller origin.
- Machine-readable: `site/apps.json`, `site/llms.txt`.
- Do **not** use legacy return keys (`pin`, `signature`, `scanValue`, `nfcValue`, `hex` as primary).

### Lint / test / build

- Tests: `bun run test` (all projects) or `bun run test:<app>` — Vitest + jsdom, runs headless. Build a single app with `bun run build:<app>`; full static site with `bun run build:site` (`scripts/build-site.sh`).
- There is no dedicated lint script or committed lint gate; Prettier is available (`bunx prettier --check .`) but currently reports pre-existing formatting warnings across the repo.
