# @atlasng/content-blocks

Render AtlasNG components dynamically from deserialized JSON content documents.

- `ContentDocument` and `ContentBlockNode` describe the JSON input.
- `ContentDefinition` describes how a node's component is loaded
  and how its config and data are validated with [Standard Schema](https://standardschema.dev/).

## Entry points

| Entry point                                         | Contents                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `@atlasng/content-blocks`                           | `provideContentBlocks` and its features, `ContentBlock`                                               |
| `@atlasng/content-blocks/types`                     | Shared document, definition, and data loader/parser types                                             |
| `@atlasng/content-blocks/definitions`               | Definition registry and `provideDefinitions`                                                          |
| `@atlasng/content-blocks/definitions/design-system` | Definitions for design-system components and `provideDesignSystemDefinitions`                         |
| `@atlasng/content-blocks/loaders`                   | Built-in data loaders and the data loader registry                                                    |
| `@atlasng/content-blocks/parsers`                   | Built-in data parsers and the data parser registry                                                    |
| `@atlasng/content-blocks/utils`                     | `ContentValidationError`, document guards, `createSchema`, `passthroughSchema`, `LazyChainedRegistry` |

The primary entry point does not re-export the secondary entry points; import shared types from `/types` and built-in
loaders and parsers from `/loaders` and `/parsers`.

## Usage

Register definitions, and optionally loaders, parsers, and configuration:

```ts
provideContentBlocks(
  { errorComponent: ContentError },
  withDefinitions([headingDefinition]),
  withDefinitions({ table: () => import('./table.definition').then((m) => m.tableDefinition) }),
  withDataLoaders({ csv: () => inject(CsvLoader) }),
);
```

Render a document with `ContentBlock`, as an element or on an element of your choice:

```html
<ang-content-block [document]="document" />
<article angContentBlock [document]="document"></article>
```

Definitions load first. A node's component, config, and data load once its definition is known, so nothing is fetched
for invalid nodes. Data values are signals: later emissions of a loader re-render the component. Nodes whose definition
declares a `placeholderComponent` show it until their content is ready; failures show the definition's
`errorComponent`, or the configured one, and are reported to Angular's `ErrorHandler`.

## Writing definitions

A `ContentDefinition` maps a node's `component` name to an Angular component and declares what the node may contain.
Schemas are [Standard Schema](https://standardschema.dev/) compatible, so any library that implements it works, e.g.
Zod or Valibot.

```ts
import { DEFAULT_CONTENT, type ContentDefinition } from '@atlasng/content-blocks/types';
import { passthroughSchema } from '@atlasng/content-blocks/utils';

export const tableDefinition: ContentDefinition = {
  name: 'table',
  component: () => import('./table').then((m) => m.Table),
  config: { caption: z.string().optional() },
  data: {
    rows: z.array(rowSchema),
    columns: { schema: z.array(columnSchema), initialValue: () => [] },
    meta: passthroughSchema(),
  },
  content: { footer: '[table-footer]', [DEFAULT_CONTENT]: 'footer' },
  placeholderComponent: TablePlaceholder,
  errorComponent: TableError,
};
```

| Field                  | Purpose                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `name`                 | Matches the node's `component`.                                                                           |
| `component`            | The component, or a loader returning it (or a module with a `default` export).                            |
| `config`               | One schema for the whole config object, or one schema per key. Without it, the node must not have config. |
| `data`                 | One schema per data key, optionally with an `initialValue`. Without it, the node must not have data.      |
| `content`              | Content names mapped to `ng-content` selectors. Without it, the node must not have content.               |
| `placeholderComponent` | Shown while the node loads. Its presence makes the node a boundary that renders independently.            |
| `errorComponent`       | Shown when the node's boundary fails. Falls back to the configured `errorComponent`.                      |
| `host`                 | Tag name of the component's host element, e.g. `a` for a component selected by `a[angTextLink]`.          |

- **Inputs:** config outputs and data are bound to the component inputs with the same (template) name. Data inputs
  receive each new value a loader emits.
- **Data:** a missing key is validated as `undefined`, so the schema decides whether it is required. An `initialValue`
  is the value while the data loads, and the value when the node does not provide the key. It is given in the
  schema's output form and is not validated.
- **Content:** unkeyed content goes to the entry named by `DEFAULT_CONTENT`, or else to the entry whose selector is
  `*`.
- **Placeholder and error components** receive the node and definition through `node` and `definition` inputs, and
  error components the thrown value through `error`, when they declare those inputs.
- **Unknown keys** in a node's config, data, or content, and keys without a component input, fail the node in dev mode.
  In prod mode they are skipped with a warning.

## Data

A node's data values are loaded by data loaders and transformed by data parsers, both registered by name:

| Data value                                         | Loaded as                                            |
| -------------------------------------------------- | ---------------------------------------------------- |
| `"/api/rows.json"`                                 | `{ type: defaultLoader, url: "/api/rows.json" }`     |
| `[1, 2, 3]`                                        | `{ type: defaultInlineLoader, value: [1, 2, 3] }`    |
| `{ "type": "http", "url": "…", "parser": "json" }` | As is. Without `parser`, `defaultParser` is applied. |

Built-in loaders are `http` (`{ url, responseType? }`, through Angular's `HttpClient`, which requires
`provideHttpClient()`) and `inline` (`{ value }`). Built-in parsers are `json` and `passthrough`.

A loader receives the source without `type` and `parser`, and returns a value, a promise, or an observable. Every
value an observable emits is parsed, validated, and bound, so loaders can stream updates. A parser receives the
loader's value and its `parser` config without `type`. Both receive a context with the node, its `path`, the data
`key`, and an `AbortSignal` that aborts when the document changes or the content block is destroyed.

Declare a `configSchema` to validate the config. It runs once, before the first `load` or `parse`, and its output is
what `load` or `parse` receives, so it can apply defaults. Invalid config fails the node. Any Standard Schema works;
`createSchema` builds one from a validate function:

```ts
import { DataLoader, DataLoaderContext } from '@atlasng/content-blocks/loaders';
import { createSchema } from '@atlasng/content-blocks/utils';

interface CsvLoaderConfig {
  url: string;
}

@Service()
export class CsvLoader implements DataLoader<CsvLoaderConfig, string> {
  readonly configSchema = createSchema<CsvLoaderConfig>((value) => {
    const { url } = value as Partial<CsvLoaderConfig>;
    return typeof url === 'string'
      ? { value: { url } }
      : { issues: [{ message: 'Expected a string.', path: ['url'] }] };
  });
  readonly #http = inject(HttpClient);

  load({ url }: CsvLoaderConfig, _context: DataLoaderContext): Observable<string> {
    return this.#http.get(url, { responseType: 'text' });
  }
}
```

Loader, parser, and definition factories run once, on first use, in the environment injection context. Routes can
register more with their own `provideContentBlocks`, `provideDefinitions`, `provideDataLoaders`, or
`provideDataParsers`; names not registered there are looked up in the parent injector.

## Configuration

`provideContentBlocks(config, ...features)` takes:

| Option                | Default         | Purpose                                                                                  |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `defaultLoader`       | `'http'`        | Loader for data given as a string.                                                       |
| `defaultInlineLoader` | `'inline'`      | Loader for data given as an array.                                                       |
| `defaultParser`       | `'passthrough'` | Parser for sources without `parser`.                                                     |
| `textComponent`       | none            | Renders text nodes, receiving the text through a `text` input. Defaults to DOM text.     |
| `errorComponent`      | none            | Error component for definitions that declare none. Without one, failures render nothing. |

The default names must be registered: in dev mode the content block throws when one is not, in prod mode it warns.

## Content block

`ContentBlock` renders its `document` input and replaces the content when the document changes.

- `rendered` emits once the top level content is shown, for each document. Nested boundaries may still be loading.
- `failed` emits a `ContentRenderFailure` for every failed boundary, including failures after rendering, such as an
  invalid data emission. It has the boundary's document `path` (`content` for the content block's own boundary), its
  `content`, the node's `definition` (none for the content block's own boundary), and the `error`, which is also passed
  to Angular's `ErrorHandler`.
- The content block's host and each nested boundary's `ang-content-boundary` host have `aria-busy="true"` while they
  load.
- Server-side rendering and hydration are not supported.

## Development

| Task      | Command                           |
| --------- | --------------------------------- |
| Build     | `npx nx build content-blocks`     |
| Test      | `npx nx test content-blocks`      |
| Lint      | `npx nx lint content-blocks`      |
| Storybook | `npx nx storybook content-blocks` |
