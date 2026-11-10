# @atlasng/cdk

Low-level building blocks for AtlasNG component authors. The CDK holds behavior and infrastructure that components share, with no visual design of its own.

## Installation

```bash
npm install @atlasng/cdk
```

## Usage

### Style loader

`StyleLoader` attaches a component's styles to the application once, without rendering the component anywhere in the page. This lets directives and other template-less features ship styles the same way components do. The service is adapted from an internal Angular CDK service.

Define a component that only carries styles, then load it where the styles are needed. Repeated calls with the same component have no further effect, and loaded styles are removed when the application is destroyed.

```ts
import { Component, Directive, inject, ViewEncapsulation } from '@angular/core';
import { StyleLoader } from '@atlasng/cdk';

@Component({
  template: '',
  styleUrl: './highlight.scss',
  encapsulation: ViewEncapsulation.None,
})
class HighlightStyles {}

@Directive({
  selector: '[appHighlight]',
  host: { class: 'app-highlight' },
})
export class Highlight {
  constructor() {
    inject(StyleLoader).load(HighlightStyles);
  }
}
```

### Breakpoints

`watchBreakpoint` returns a signal that tracks the same expressions as the design-system Sass `breakpoint()` mixin: a breakpoint name or length, optionally followed by `up`, `down`, or `only`. Pass a list to match any of several expressions. `watchActiveBreakpoint` returns the name of the active breakpoint. Both are built on the Angular CDK `BreakpointObserver` and must be called in an injection context or given an `injector` option.

```ts
import { computed, Component } from '@angular/core';
import { watchActiveBreakpoint, watchBreakpoint } from '@atlasng/cdk';

@Component({/* ... */})
export class Gallery {
  readonly isDesktop = watchBreakpoint('medium');
  readonly isCompact = watchBreakpoint(['small down', 'x-large']);
  readonly breakpoint = watchActiveBreakpoint();
  readonly columns = computed(() => (this.breakpoint() === 'x-small' ? 1 : 3));
}
```

The defaults match the design-system `$breakpoints` map. If an application reconfigures that map, provide the same values with `provideBreakpoints({ ... })`. Use `breakpointQuery` to get the media condition for an expression directly.

### Search

`@atlasng/cdk/search` is a headless search layer. `injectSearch` searches a list with the injected `SEARCH_ENGINE` and returns `results`, `items`, `suggestions`, `loading`, and `error` signals. The default engine ignores case and accents, requires every word of the term to match, and ranks exact matches, then prefixes, then word prefixes, then other matches. Each result carries match ranges that the `angSearchHighlight` directive renders with `<mark>`.

```ts
import { Component, signal } from '@angular/core';
import { injectSearch, SearchHighlight } from '@atlasng/cdk/search';

@Component({
  imports: [SearchHighlight],
  template: `
    @for (result of search.results(); track result.item.id) {
      <span [angSearchHighlight]="result.item.label" [angSearchHighlightRanges]="result.matches?.[0]?.ranges"></span>
    }
  `,
})
export class OrganList {
  readonly term = signal('');
  readonly search = injectSearch({ items: ORGANS, term: this.term, fields: ['label'] });
}
```

Every `injectSearch` option accepts a value or a signal, so options can come from component inputs. Pass `order: 'source'` to keep matches in item order, for example in a filter list. `suggestions` holds values of `suggestionField` (or the items themselves when they are strings or numbers) with their match ranges, ready for `angSearchHighlight`.

Use `provideSearch(withCustomEngine(...), withSearchConfig({ debounce, minLength, suggestionLimit }))` in application, route, or component providers to swap the engine or change the defaults. Result limits are set per call only, so a global default never truncates a filter list. Engines implement `SearchEngine` and may return results synchronously or as a promise. See the JSDoc in [libs/cdk/search/src](search/src) for the full API.

### Error codes

Error codes are exported from `@atlasng/cdk/errors` as `CdkErrorCode` and re-exported from `@atlasng/cdk`.
