# @atlasng/core

The foundation layer of AtlasNG. It provides injection tokens for browser globals, a small helper for building typed, defaults-aware configuration tokens, and a coded error class. Most AtlasNG libraries build on it, and it has no dependencies on other `@atlasng/*` packages.

## Installation

```bash
npm install @atlasng/core
```

## Usage

### Browser tokens

Inject browser globals through tokens instead of referencing them directly. The tokens resolve through Angular's `DOCUMENT`, so they can be replaced in tests and during server-side rendering. When no window is available (for example during server-side rendering without a DOM), `WINDOW` and the tokens derived from it resolve to `undefined`.

| Token                     | Value                                                                          |
| ------------------------- | ------------------------------------------------------------------------------ |
| `DOCUMENT`                | Re-export of Angular's `DOCUMENT` token                                        |
| `WINDOW`                  | The global `window` object, or `undefined` when none is available              |
| `LOCATION`                | `document.location`                                                            |
| `LOCAL_STORAGE`           | `localStorage`, or `undefined` when storage is blocked or there is no window   |
| `SESSION_STORAGE`         | `sessionStorage`, or `undefined` when storage is blocked or there is no window |
| `SAFE_LOCAL_STORAGE`      | `SafeStorage` wrapping `LOCAL_STORAGE`                                         |
| `SAFE_SESSION_STORAGE`    | `SafeStorage` wrapping `SESSION_STORAGE`                                       |
| `NAVIGATION`              | The Navigation API (`window.navigation`), or `undefined` when unsupported      |
| `RESIZE_OBSERVER`         | The `ResizeObserver` constructor, or `undefined`                               |
| `CUSTOM_ELEMENT_REGISTRY` | `window.customElements`, or `undefined`                                        |

```ts
import { inject } from '@angular/core';
import { LOCAL_STORAGE } from '@atlasng/core';

export class PreferencesStore {
  readonly #storage = inject(LOCAL_STORAGE);

  save(value: string): void {
    this.#storage?.setItem('preferences', value);
  }
}
```

### Safe storage

Browsers can throw from storage methods, for example when the quota is exceeded. `SafeStorage` wraps a `Storage`, or `undefined`, and catches those errors: `getItem` and `key` return `null`, `length` returns `0`, and `setItem`, `removeItem`, and `clear` return `false` on failure instead of throwing. `available` tells whether a storage backend was provided. Inject `SAFE_LOCAL_STORAGE` or `SAFE_SESSION_STORAGE` to get adapters for the browser storages.

```ts
import { inject } from '@angular/core';
import { SAFE_LOCAL_STORAGE } from '@atlasng/core';

export class PreferencesStore {
  readonly #storage = inject(SAFE_LOCAL_STORAGE);

  save(value: string): boolean {
    return this.#storage.setItem('preferences', value);
  }
}
```

### Configuration tokens

`createConfigurationToken` creates an injection token together with typed `inject` and `provide` helpers. Values supplied by the caller are merged over the defaults; `undefined` values are ignored. Properties that have defaults are typed as required in the injected result.

```ts
import { createConfigurationToken, type } from '@atlasng/core';

export interface GreeterConfig {
  greeting?: string;
  name?: string;
}

const GREETER_CONFIG = createConfigurationToken({
  name: 'GREETER_CONFIG',
  config: type<GreeterConfig>(),
  defaults: () => ({ greeting: 'Hello' }),
});

export const provideGreeterConfig = GREETER_CONFIG.provide;

export class Greeter {
  // Typed as { readonly greeting: string; readonly name?: string }
  readonly config = GREETER_CONFIG.inject();
}
```

The `defaults` factory runs in an injection context, so it may call `inject()`. `GREETER_CONFIG.inject()` must also be called in an injection context, for example in a field initializer or constructor.

Use `ConfigurationOf` to name the injected type, for example to pass the configuration around:

```ts
function greet(config: ConfigurationOf<typeof GREETER_CONFIG>): string {
  return `${config.greeting}, ${config.name ?? 'world'}!`;
}
```

### Coded errors

`AngError` carries a numeric code, modelled on Angular's `RuntimeError`. Pass the message only in dev mode: Angular production builds define `ngDevMode` as `false`, so the string is dropped and the error message is just the code, e.g. `ANG3301`.

```ts
import { AngError } from '@atlasng/core';

throw new AngError(
  AnalyticsErrorCode.InvalidPermissionsJson,
  (typeof ngDevMode === 'undefined' || ngDevMode) && 'Invalid AnalyticsPermissions JSON',
);
```

Each library declares its codes in an enum within its own range, exported from its `errors` entry point and re-exported from its main entry point:

| Range       | Library                   | Enum                     |
| ----------- | ------------------------- | ------------------------ |
| `0000–0999` | `@atlasng/core`           |                          |
| `1000–1999` | `@atlasng/common`         |                          |
| `2000–2999` | `@atlasng/cdk`            |                          |
| `3000–3999` | `@atlasng/analytics`      | `AnalyticsErrorCode`     |
| `4000–4999` | `@atlasng/design-system`  |                          |
| `5000–5999` | `@atlasng/content-blocks` | `ContentBlocksErrorCode` |
| `6000–6999` | `@atlasng/labs`           |                          |

The `@atlasng/no-unguarded-error-message` rule from `@atlasng/eslint-plugin` reports error messages that are not guarded by `ngDevMode`.
