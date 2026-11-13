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

`@atlasng/cdk/search` is a headless search layer. `injectSearch` searches a list with the injected `SearchEngine` and returns a read-only Angular `Resource` of the results (`value`, `status`, `error`, `isLoading`, `hasValue()`), plus an `items` signal, a `suggestions` resource, and `reload()` and `destroy()`. The default engine ignores case and accents, requires every word of the term to match, and ranks exact matches, then prefixes, then word prefixes, then other matches. Each result carries match ranges that the `angSearchHighlight` directive renders with `<mark>`.

```ts
import { Component, signal } from '@angular/core';
import { injectSearch, SearchHighlight } from '@atlasng/cdk/search';

@Component({
  imports: [SearchHighlight],
  template: `
    @for (result of search.value(); track result.item.id) {
      <span [angSearchHighlight]="result.item.label" [angSearchHighlightRanges]="result.matches?.[0]?.ranges"></span>
    }
  `,
})
export class OrganList {
  readonly term = signal('');
  readonly search = injectSearch({ items: ORGANS, term: this.term, fields: ['label'] });
}
```

Every `injectSearch` option accepts a value, a signal, or a function such as `() => this.filter().term`, so options can come from component inputs. Pass `order: 'source'` to keep matches in item order, for example in a filter list. Pass `filter` to restrict the results and suggestions to the items a predicate accepts without rebuilding the index; `limit` is applied after it. Because function options are called to read their value, wrap the predicate in a signal or a function that returns it, such as `filter: () => this.isVisible`. `suggestions.value()` holds values of `suggestionField` (or the items themselves when they are strings or numbers) with their match ranges, ready for `angSearchHighlight`.

Use `provideSearch({ debounce, minLength, suggestionLimit }, withCustomEngine(...))` in application, route, or component providers to change the defaults or swap the engine. A nested configuration is merged over its parent's, and `withDefaultEngine()` restores the built-in engine below a custom one. Result limits are set per call only, so a global default never truncates a filter list. Engines implement `SearchEngine`, must honour the `filter` of a query and of `suggest`, and may return results synchronously or as a promise. As with every resource, `value()` throws while an asynchronous search is in the `'error'` status, so check `hasValue()` first or read `items()`, which is empty in that case. See the JSDoc in [libs/cdk/search/src](search/src) for the full API.

### Friendly wrap

`angFriendlyWrap` from `@atlasng/cdk/friendly-wrap` renders a string into its host with a line break opportunity (`<wbr>`) after each run of break characters, so URLs, IRIs, IDs, and file names wrap at readable points instead of overflowing their container or breaking anywhere. By default it breaks after `/`, `.`, `_`, `-`, `:`, `?`, `=`, `&`, and `#`. Pass `angFriendlyWrapCharacters` to change the set, as a string of characters or a list of symbols. The content is built from text nodes, so it needs no sanitizer bypass, and `<wbr>` adds no characters, so copied text matches the original string. The directive adds no styles.

```ts
import { Component } from '@angular/core';
import { FriendlyWrap } from '@atlasng/cdk/friendly-wrap';

@Component({
  imports: [FriendlyWrap],
  template: `
    <a [href]="iri"><span [angFriendlyWrap]="iri"></span></a>
    <code [angFriendlyWrap]="path" angFriendlyWrapCharacters="/"></code>
  `,
})
export class OntologyLink {
  readonly iri = 'http://purl.obolibrary.org/obo/UBERON_0002113';
  readonly path = '/data/kidney/cortex.csv';
}
```

`friendlyWrapSegments(text, characters)` returns the segments between the break opportunities for use outside a template.

### Error codes

Error codes are exported from `@atlasng/cdk/errors` as `CdkErrorCode` and re-exported from `@atlasng/cdk`.
