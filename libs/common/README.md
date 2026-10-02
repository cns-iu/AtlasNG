# @atlasng/common

Shared Angular utilities used by AtlasNG libraries and applications: a link directive that handles internal routes and external URLs in one API, a pluggable link-handling strategy, and a DOM-safe ID generator.

## Installation

```bash
npm install @atlasng/common
```

`@angular/router` is a peer dependency, but it only has to be configured when you opt into router-based link handling.

## Usage

### Links

`AnyLink` (`[angAnyLink]`) renders and navigates links. It accepts the same commands as `routerLink` (a path string, a command array, or a `UrlTree`) as well as absolute URLs, and it supports the familiar router inputs such as `queryParams`, `fragment`, `replaceUrl`, and `state`.

```ts
import { Component } from '@angular/core';
import { AnyLink, AnyLinkActive } from '@atlasng/common';

@Component({
  selector: 'app-nav',
  imports: [AnyLink, AnyLinkActive],
  template: `
    <nav angAnyLinkActive="active" ariaCurrentWhenActive="page">
      <a angAnyLink="/docs" [queryParams]="{ tab: 'intro' }">Docs</a>
      <a angAnyLink="https://github.com/cns-iu/AtlasNG" target="_blank">GitHub</a>
    </nav>
  `,
})
export class Nav {}
```

On anchor-like hosts the directive sets `href`, `target`, `rel`, and `download`. On other elements it adds `tabindex="0"` (unless one is set) so the link stays keyboard-reachable.

`AnyLinkActive` (`[angAnyLinkActive]`) applies CSS classes, and optionally `aria-current`, while a link is active. Place it on the link itself or on an ancestor to track every descendant `AnyLink`. Use `angAnyLinkActiveOptions` to control matching (for example `{ exact: true }`) and the `isActiveChange` output to react to changes.

### Link handlers

A `LinkHandler` decides how links are resolved, navigated, and matched as active. Choose one at bootstrap with `provideLinkHandler`:

```ts
import { provideRouter } from '@angular/router';
import { provideLinkHandler, withRouterHandler } from '@atlasng/common';

bootstrapApplication(App, {
  providers: [provideRouter(routes), provideLinkHandler(withRouterHandler())],
});
```

| Feature                   | Behavior                                                                        |
| ------------------------- | ------------------------------------------------------------------------------- |
| `withRouterlessHandler()` | Default. Uses native anchors and `window.location`; no router required.         |
| `withRouterHandler()`     | Navigates internal routes with the Angular Router.                              |
| `withCustomHandler(fn)`   | Uses a handler returned by `fn`, for example a subclass of `RouterLinkHandler`. |

Only one handler feature may be passed; development builds throw if more are provided. Router-only inputs such as `state` or `skipLocationChange` produce a development warning when used with the routerless handler.

### ID generator

`IdGenerator` creates unique, DOM-safe IDs for `id`, `aria-labelledby`, and similar attributes.

```ts
import { inject } from '@angular/core';
import { IdGenerator } from '@atlasng/common';

const id = inject(IdGenerator).getId('ang-tooltip'); // "ang-tooltip-0", "ang-tooltip-1", ...
```

IDs include the application's `APP_ID` when it is not the default `ng`. Production builds also add a random infix so that IDs from multiple Angular applications on the same page do not collide. Use `provideIdGeneratorConfig({ infix })` to set a fixed infix (`string`), always use a random one (`true`), or turn it off (`false`).
