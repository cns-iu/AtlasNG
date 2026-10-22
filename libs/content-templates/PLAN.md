# Content templates plan

`@atlasng/content-templates` (name provisional) renders components dynamically from a deserialized JSON document.
Async work happens in several places: definition lookup, lazy component imports, and per-node data loading.

## Status

| Phase                                             | State                                         |
| ------------------------------------------------- | --------------------------------------------- |
| 1. JSON document and definition contracts         | Done (`types/`)                               |
| 2. Registry providers (`provideContentTemplates`) | Done (`src/lib/providers.ts`)                 |
| 3. Render tree, pipeline, and validation          | Done (`src/lib/{nodes,pipeline,validation}/`) |
| 4. Outlet, boundaries, errors                     | Done (`src/lib/outlet/`)                      |
| 5. Built-in loaders/parsers                       | Done (`loaders/`, `parsers/`)                 |

## Decisions

- **Location:** its own library with the `layer:content-templates` tag. It may import design-system, analytics, cdk,
  common, and core; labs may import it.
- **Rendering model (hybrid):** a node's subtree is fully resolved before the node is created, _except_ for nodes whose
  definition declares a `placeholderComponent`. Those nodes are async boundaries: they render the placeholder as soon
  as the definition is known and swap in the real subtree once it is ready.
- **Definitions first:** when a document arrives, every node's definition starts loading at once. A node's component,
  config, and data only start once its definition is known and its keys are checked, so nothing is fetched for unknown
  keys or invalid nodes. Boundaries decide _when_ content is shown.
- **Data as signals:** each data key is a signal. Later emissions of a loader are parsed, validated, and written to it,
  so rendered components update.
- **Validation:** config and data are validated with [Standard Schema](https://standardschema.dev/) compatible schemas
  (`@standard-schema/spec`, types only). No schema library is a dependency.
- **Bindings:** derived from `reflectComponentType`; definitions do not declare inputs.
- **Projection:** a definition's `content` maps friendly content names to `ng-content` selectors (e.g.
  `{ body: '*', actions: '[actions]' }`). Unkeyed content goes to the entry whose selector is `*`, or to the entry
  named by the `DEFAULT_CONTENT` symbol key for components without a catch-all `ng-content`.
- **Types stay simple for now:** definitions, loaders, and parsers are loosely typed. Schema-driven generics and
  inference helpers are deferred (see [Later](#later)).
- **Entry points:** shared types live in `@atlasng/content-templates/types`, the definition registry in
  `@atlasng/content-templates/definitions`, built-in loaders and their registry in
  `@atlasng/content-templates/loaders`, and built-in parsers and their registry in `@atlasng/content-templates/parsers`.
  Shared runtime helpers live in `@atlasng/content-templates/utils`: `ContentValidationError` (so loaders and parsers can
  throw it), the document guards (`isContentElementNode`, `isContentDataSource`, `isNamedContentRecord`), `passthroughSchema`,
  and the `LazyChainedRegistry` base class. The
  primary entry point imports these but does not re-export them.

## 1. JSON document (`document.ts`)

```ts
interface ContentDocument {
  version: 1; // typeof CONTENT_DOCUMENT_VERSION
  content: Arrayable<ContentNode>;
}

type ContentNode = string | ContentElementNode; // string -> DOM Text node

interface ContentElementNode {
  component: string; // definition name
  config?: Record<string, JsonValue>;
  data?: Record<string, string | JsonValue[] | ContentDataSource>;
  content?: Arrayable<ContentNode> | Record<string, Arrayable<ContentNode>>;
}

interface ContentDataSource {
  type: string;
  parser?: string | { type: string; [key: string]: JsonValue };
  [key: string]: JsonValue | undefined;
}
```

Discrimination rules (`isContentElementNode`, `isContentDataSource`):

- `content`: string -> text node; array -> node list; object **with** `component` -> single node (all three target
  the default entry); object **without** `component` -> record keyed by content name. A content name therefore cannot
  be `component`.
- `data`: string -> `{ type: <defaultLoader>, url: <string> }`; array -> `{ type: <defaultInlineLoader>, value: <array> }`;
  object -> `ContentDataSource`. Inline objects use the built-in `inline` loader: `{ "type": "inline", "value": { ... } }`.
  Sources without `parser` get `defaultParser`. The defaults are `http`, `inline`, and `passthrough`, set through
  `provideContentTemplates({ defaultLoader, defaultInlineLoader, defaultParser })`.
- A source names its loader in `type` and is itself the loader config: the loader receives the source without
  `parser`, `type` included, so loader configs cannot use a `parser` key.
- `parser`: a string names a registered parser; an object names it in `type` and is itself the config (passed as is,
  `type` included).
- Loaders only fetch, parsers only transform; the default `passthrough` parser uses the loader output as is.

Example:

```json
{
  "version": 1,
  "content": [
    { "component": "content-header", "config": { "tagline": "Overview", "level": 2, "id": "overview" } },
    {
      "component": "content-paragraph",
      "content": ["Read the ", { "component": "text-link", "config": { "href": "/docs" }, "content": "docs" }, "."]
    },
    {
      "component": "card",
      "content": {
        "title": "Sales",
        "content": {
          "component": "table",
          "data": {
            "rows": { "type": "http", "url": "/api/sales.json", "responseType": "text", "parser": "json" },
            "columns": [{ "id": "region" }, { "id": "total" }],
            "summary": "/api/summary.json"
          }
        }
      }
    }
  ]
}
```

## 2. Component definition (`definition.ts`, `type-ref.ts`, `*-schema.ts`)

```ts
type TypeRef<T> = Type<T> | (() => Promisable<Type<T> | DefaultExport<Type<T>>>);

type ContentConfigSchema =
  | StandardSchemaV1<JsonValue, object> // whole config object
  | Record<string, StandardSchemaV1<JsonValue | undefined, unknown>>; // one schema per config key

type ContentDataSchema = Record<
  string,
  StandardSchemaV1<unknown> | { schema: StandardSchemaV1<unknown>; initialValue?: unknown | (() => unknown) }
>;

const DEFAULT_CONTENT: unique symbol;

type ContentProjectionSchema = Record<string, string> & { [DEFAULT_CONTENT]?: string };

interface ContentDefinition<TComponent = unknown> {
  name: string; // matches ContentElementNode.component

  component: TypeRef<TComponent>;
  placeholderComponent?: Type<unknown>; // sync; makes the node an async boundary
  errorComponent?: TypeRef<unknown>; // falls back to the configured errorComponent

  host?: string; // host element tag, e.g. 'a' for `a[angTextLink]`; defaults to Angular's choice
  config?: ContentConfigSchema; // absent -> node must not provide config
  data?: ContentDataSchema; // unknown data keys are errors
  content?: ContentProjectionSchema; // content name -> ng-content selector; absent -> node must not provide content
}

const tableDefinition: ContentDefinition = {
  name: 'table',
  component: () => import('@atlasng/design-system/table').then((m) => m.Table),
  config: { caption: optional(string()) },
  data: {
    rows: array(record(string(), unknown())),
    columns: { schema: array(columnSchema), initialValue: [] },
  },
  placeholderComponent: TablePlaceholder,
};
```

- Config: a single object schema validates the whole config; a per-key record validates each key, and keys without a
  schema are errors.
- Data: `passthroughSchema()` from `/utils` accepts any value. `initialValue` (a function is called for a fresh value
  each time) is the key's value while its data loads, and its only value when the node does not provide the key. It is
  given in the schema's output form and not validated. Without one, a missing key validates `undefined`, so the schema
  decides optionality.
- `TypeRef` distinguishes a class from a loader with `reflectComponentType`. Only components are lazy,
  because a plain function cannot be told apart from a loader returning one.

### Bindings and projection

- **Inputs:** config outputs and data keys are matched against `mirror.inputs[].templateName`. Config binds as
  `inputBinding(key, () => value)` and data as `inputBinding(key, signal)`, so later emissions update the input.
  Unmatched keys and config/data key collisions are dev-mode errors; unbound required inputs surface Angular's own
  error.
- **Projection:** `mirror.ngContentSelectors` gives the projection indices. A content name is looked up in the
  definition's `content` and its selector matched against those indices. Unkeyed content goes to the entry named by
  `DEFAULT_CONTENT`, else to the entry whose selector is `*`. Unknown content names, selectors missing from the
  component, and unkeyed content without a default entry are dev-mode errors.
- **Placeholder and error components:** inputs are bound only if reflection shows them. A placeholder receives the
  boundary's `ContentElementNode` in a `node` input and its `ContentDefinition` in a `definition` input. An
  error component (the definition's or the configured `errorComponent`) receives the same, plus the thrown value in an
  `error` input. Both are `undefined` for the outlet's root boundary. Missing inputs are skipped silently.
- **Text:** rendered as a DOM text node, or with the configured `textComponent`, which receives a `text` input.

## 3. Data loaders and parsers (`data-loader-registry.ts`, `data-parser-registry.ts`)

```ts
interface DataLoader<TConfig = unknown, TResult = unknown> {
  load(config: TConfig, context: DataLoaderContext): Promisable<TResult> | Observable<TResult>;
}

interface DataParser<TConfig = unknown, TInput = unknown, TOutput = unknown> {
  parse(input: TInput, config: TConfig, context: DataParserContext): Promisable<TOutput>;
}

// Separate types so each can grow independently; both start out the same.
interface DataLoaderContext {
  node: Readonly<ContentElementNode>;
  signal: AbortSignal; // aborted on document change / destroy
}

interface DataParserContext {
  node: Readonly<ContentElementNode>;
  signal: AbortSignal;
}
```

- Loaders and parsers carry no name; they are named at registration.
- A loader's `config` is the source without `parser`, `type` included. A parser's `config` is the source's `parser`
  object as is; the string form is passed as `{ type: <name> }`. Neither type requires `type`, so loaders and parsers
  declare only the keys they use. Config is not schema-validated for now.
- `load` and `parse` do not run in an injection context; dependencies are injected when the instance is created (see
  [Registration](#4-registration-phase-2)). Observables may emit many times; each value is parsed and validated, and a
  newer value supersedes one still in progress. A stream error after the first value fails the node.

Built-ins (`@atlasng/content-templates/loaders` and `@atlasng/content-templates/parsers`, alongside their
registries), registered like any other loader or parser. Each is a `@Service()` provided in the root injector, so its
factory injects it, e.g. `() => inject(HttpDataLoader)`:

- `HttpDataLoader`: GET through the root `HttpClient`. Config
  `{ url, responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' }`, default `'json'`.
- `InlineDataLoader`: config `{ value }`, returns `value`.
- `JsonDataParser`: `JSON.parse` for strings; other input is returned unchanged.
- `PassthroughDataParser`: returns its input unchanged.

## 4. Registration (phase 2)

Feature functions, following `provideLinkHandler(withX(), ...)` in `libs/common`:

```ts
provideContentTemplates(
  { defaultParser: 'json', errorComponent: ContentError },
  withDefinitions([contentHeaderDefinition, contentParagraphDefinition]),
  withDefinitions({ table: () => import('./table.definition').then((m) => m.tableDefinition) }),
  withDataLoaders({ http: () => inject(HttpDataLoader), inline: () => inject(InlineDataLoader) }),
  withDataParsers({ json: () => inject(JsonDataParser) }),
);
```

Loaders, parsers, and definition records are registered as factories returning a value or a promise. A factory runs
once, lazily on first use, in the environment injection context, so it can `inject()` dependencies before its first
`await`. `withDefinitions` also accepts an array of definitions, registered under their `name`.

Each feature contributes a record to a multi token (`DEFINITIONS`, `DATA_LOADERS`,
`DATA_PARSERS`). Definitions, loaders, and parsers can also be registered without `provideContentTemplates`, through
`provideDefinitions(definitions)` from `/definitions`, `provideDataLoaders(loaders)` from `/loaders`, and
`provideDataParsers(parsers)` from `/parsers`; each provides its multi token contribution and registry for the
environment injector, and `withDefinitions` / `withDataLoaders` / `withDataParsers` wrap them.

`provideContentTemplates` provides three registries for its environment injector. All extend `LazyChainedRegistry<T>`
(from `/utils`), whose `get(name): Promise<T>` runs the factory once and caches the result, including rejections.
`reset(name)` and `clear()` drop cached results so the next `get` runs the factory again:

- `DefinitionRegistry` (from `/definitions`): the registered key acts as an alias and may differ from the definition's `name`.
- `DataLoaderRegistry` / `DataParserRegistry`.
- Unknown names are delegated to the same registry in a parent environment injector, so route providers add to the
  application's registrations; the parent's result is cached on the child too. Without one, `get` returns `undefined`
  (misses are not cached); the pipeline turns this into an `Unknown <kind> '<name>'.` error, e.g.
  `Unknown data loader 'csv'.`, and surfaces it at the nearest boundary. `has(name)` checks registration without
  running the factory; the outlet uses it to check the configured default loader and parser names (dev-mode error,
  prod warning).
- Within one injector, a later registration of a name replaces an earlier one.

`provideContentTemplates(config?, ...features)` also provides `CONTENT_TEMPLATES_CONFIG` (`defaultLoader`,
`defaultInlineLoader`, `defaultParser`, `textComponent`, `errorComponent`), created with `createConfigurationToken` from
`libs/core/src/lib/configuration-token.ts`.

## 5. Rendering pipeline (phases 3-4)

1. **Render tree (`nodes/`):** `buildRenderTree(document, signal)` creates a `RenderTextNode` or `RenderElementNode`
   per document node, synchronously. Structural problems (bad version, a node that is neither a string nor an element)
   throw `ContentValidationError`. Each element has an `AbortSignal` chained to its parent's, so aborting a subtree
   stops its loads, and node paths such as `content.@default[0].content.body[1]` are used in errors.
2. **Definitions (`pipeline/`):** `startPipeline(nodes, context)` starts every definition load at once. A node is
   checked as soon as its definition is known and its parent released it: unknown `config`, `data`, and `content` keys
   are dev-mode errors and prod warnings, and in prod unknown content is dropped. A checked node releases its children.
3. **Resolve:** a checked node loads its component, validates its config (deferred a microtask), and loads its data in
   parallel, then checks that every key has a component input. Results are stored on the node as `definition` and
   `resolved` promises, and the first failure, including later data emissions, as the node's `error` signal. Failures
   caused by an ancestor's abort are not recorded.
4. **Boundaries (`outlet/`):** the outlet's root and every node with a `placeholderComponent` are boundaries. A boundary
   waits for its nodes and their descendants up to nested boundaries, then builds them bottom-up: text -> text node or
   `textComponent`; element -> `createComponent(type, { bindings, projectableNodes, elementInjector })`; nested
   boundary -> an `ang-content-boundary` host (`display: contents`) showing the placeholder until it is ready.
5. **Errors:** a boundary watches the `error` signals of its nodes. The first error is passed to Angular's
   `ErrorHandler`, the boundary's nodes are aborted, and the content is replaced with the error component, or nothing
   without one. Schema failures are `ContentValidationError`s carrying the node path and Standard Schema issues.

Usage: `<ang-content-outlet [document]="document" />` or `<article angContentOutlet [document]="document">`
(`ContentOutlet`). Changing `document` aborts pending loads and replaces the rendered content; destroying the outlet
destroys every created component. Created components use the outlet's element and environment injectors and are
attached to `ApplicationRef` for change detection.

## Later

- Definitions for design-system components (removed for now; previously the `design-system-definitions` entry point).
- Generics on definitions, loaders, and parsers inferred from their schemas, with a `defineContentComponent` helper
  that rejects, at compile time, an `initialValue` not matching its schema output.
- Helper types such as `InferContentConfig<TDefinition>` and `InferContentData<TData>`.
- Standard Schema validation of loader and parser config.

## Open questions

- Compile-time checking of config/data keys against component inputs (input aliases make this unreliable).
- Re-rendering and diffing when the document changes (nodes currently have no `key`).
- Whether loaders' `load` should also accept Angular `Resource` or `Signal`.
- Final library name.
