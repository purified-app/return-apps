# shared-ui

Shared design system and returnUrl helpers for apps in this workspace.

## Contents

- **Styles** (`styles/`) — tokens, base reset, buttons, home/demo/panel chrome, page shells
- **Core** — `ReturnUrlValidator`, `appBaseUrl()`
- **UI** — `RbPage`, `RbPanel`, `RbMetaList`

## Usage in an app

```ts
import { ReturnUrlValidator, appBaseUrl, RbMetaList, RbPanel } from 'shared-ui';
```

Global styles (in `angular.json`):

```json
"styles": ["projects/shared-ui/styles/main.scss"],
"stylePreprocessorOptions": {
  "includePaths": ["projects/shared-ui/styles"]
}
```

Page shell via host class:

```ts
host: { class: 'rb-page rb-page--home' }
```

Or the `RbPage` directive / `hostDirectives`.
