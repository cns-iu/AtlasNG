# @atlasng/core

The foundation layer of AtlasNG. It provides SSR-safe injection tokens for browser globals and a small helper for building typed, defaults-aware configuration tokens. Every other AtlasNG library builds on it, and it has no dependencies on other `@atlasng/*` packages.

## Installation

```bash
npm install @atlasng/core
```

## Usage

### Browser tokens

Inject browser globals through tokens instead of referencing them directly. The tokens resolve through Angular's `DOCUMENT`, so they can be replaced in tests and during server-side rendering.

| Token                     | Value                                                    |
| ------------------------- | -------------------------------------------------------- |
| `DOCUMENT`                | Re-export of Angular's `DOCUMENT` token                  |
| `WINDOW`                  | The global `window` object                               |
| `LOCATION`                | `document.location`                                      |
| `LOCAL_STORAGE`           | `localStorage`, or `undefined` when storage is blocked   |
| `SESSION_STORAGE`         | `sessionStorage`, or `undefined` when storage is blocked |
| `RESIZE_OBSERVER`         | The `ResizeObserver` constructor, or `undefined`         |
| `CUSTOM_ELEMENT_REGISTRY` | `window.customElements`, or `undefined`                  |

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
