# Content templates plan

`@atlasng/content-templates` (name provisional) renders components dynamically from a deserialized JSON document.
Async work happens in several places: definition lookup, lazy component imports, and per-node data loading.

## Status

| Phase                                             | State                         |
| ------------------------------------------------- | ----------------------------- |
| 1. JSON document and definition contracts         | Done (`types/`)               |
| 2. Registry providers (`provideContentTemplates`) | Done (`src/lib/registries/`)  |
| 3. Resolver (eager loading + validation)          | Done (`src/lib/resolver/`)    |
| 4. Renderer, outlet host, boundaries, errors      | Done (`src/lib/renderer/`)    |
| 5. Built-in loaders/parsers                       | Done (`loaders/`, `parsers/`) |

## Decisions

- **Location:** its own library with the `layer:content-templates` tag. It may import design-system, analytics, cdk,
  common, and core; labs may import it.
- **Rendering model (hybrid):** a node's subtree is fully resolved before the node is created, _except_ for nodes whose
  definition declares a `placeholderComponent`. Those nodes are async boundaries: an outlet host renders the placeholder
  immediately and swaps in the real subtree once it is ready.
- **Eager loading:** when a document arrives, definitions, components, and data for _every_ node start loading in
  parallel, regardless of tree position. Boundaries only decide _when_ content is shown.
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
  Shared runtime helpers, such as the `LazyChainedRegistry` base class, live in `@atlasng/content-templates/utils`. The
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
  data?: Record<string, string | unknown[] | ContentDataSource>;
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
- `data`: array -> inline data used as is; object -> `ContentDataSource`. Plain strings are not accepted for now
  (see [Later](#later)). Inline objects use the built-in
  `inline` loader: `{ "type": "inline", "value": { ... } }`.
- A source names its loader in `type` and is itself the loader config: the loader receives the source without
  `parser`, `type` included, so loader configs cannot use a `parser` key.
- `parser`: a string names a registered parser; an object names it in `type` and is itself the config (passed as is,
  `type` included).
- Parsers are optional per source. Loaders only fetch, parsers only transform; without a parser the loader output is
  used as is.

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
  errorComponent?: TypeRef<unknown>; // falls back to the renderer default

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
- Data: `passthroughSchema()` from `/utils` accepts any value. Missing data uses `initialValue` if present (a function is called for a fresh value
  each time), otherwise `undefined` is validated, so
  the schema decides optionality.
- `TypeRef` distinguishes a class from a loader with `reflectComponentType`. Only components are lazy,
  because a plain function cannot be told apart from a loader returning one.

### Bindings and projection

- **Inputs:** `{ ...configOutput, ...dataOutputs }` is keyed by input _template name_ and matched against
  `mirror.inputs[].templateName`. Each match becomes `inputBinding(templateName, () => value)`. Unmatched keys and
  config/data key collisions are dev-mode errors; unbound required inputs surface Angular's own error.
- **Projection:** `mirror.ngContentSelectors` gives the projection indices. A content name is looked up in the
  definition's `content` and its selector matched against those indices. Unkeyed content goes to the entry named by
  `DEFAULT_CONTENT`, else to the entry whose selector is `*`. Unknown content names, selectors missing from the
  component, and unkeyed content without a default entry are dev-mode errors.
- **Placeholder and error components:** inputs are bound only if reflection shows them. A placeholder receives the
  boundary's `ContentElementNode` in a `node` input and its `ContentDefinition` in a `definition` input. An
  error component (the definition's or the renderer default) receives the same, plus the thrown value in an `error`
  input. `definition` is `undefined` when the definition lookup itself failed. Missing inputs are skipped silently.

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
  [Registration](#4-registration-phase-2)). Observables use their first emission.

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
  (misses are not cached); the resolver turns this into an `Unknown <kind> '<name>'.` error, e.g.
  `Unknown data loader 'csv'.`, and surfaces it at the nearest boundary.
- Within one injector, a later registration of a name replaces an earlier one.

Renderer-level config (default error component, dev-mode strictness) uses `createConfigurationToken` from
`libs/core/src/lib/configuration-token.ts`.

## 5. Rendering pipeline (phases 3-4)

1. **Eager resolve:** walk the whole tree. For every element node, start in parallel: definition lookup -> config
   validation; component load; and for each data entry, loader lookup -> load -> parser lookup -> parse -> schema
   validation. This produces a tree of per-node promises/signals. Nothing waits on its parent, so a parent's data
   cannot feed its children.

   Implemented as `ContentResolver.resolve(document, signal): ResolvedContentNode[]` (provided by
   `provideContentTemplates`). Text becomes `{ kind: 'text', path, text }`; an element becomes a
   `ResolvedContentElement` with `definition`, `component`, `config`, `data`, and `ready` promises (all marked handled)
   plus `defaultContent` / `slotContent` children. Config and data outputs omit `undefined` values so input defaults
   apply. Observable loads use the first emission and are unsubscribed when `signal` aborts. Structural problems (bad
   version, a node that is neither a string nor an element) throw `ContentValidationError` synchronously.

2. **Boundaries:** the renderer root is always a boundary, and every node with a `placeholderComponent` starts a new one. A
   boundary is ready when all nodes in it (stopping at nested boundaries) are resolved: `whenContentReady(nodes)` /
   `whenElementReady(element)` in `resolver/boundary.ts`.
3. **Creation (bottom-up, synchronous once a boundary is ready):** text -> `document.createTextNode`; element ->
   `createComponent(type, { bindings, projectableNodes, elementInjector })`; nested boundary -> an
   `ang-content-outlet` host (`display: contents`) created immediately with its placeholder and projected into the
   parent, which later swaps the placeholder for the real node inside that host. The `ComponentRef` lifecycle follows
   `libs/design-system/table/src/lib/definitions/template-definition-cache.ts`.
4. **Errors:** a failure propagates to the nearest boundary, which shows its `error` component (or the renderer
   default). Schema failures are wrapped in a `ContentValidationError` carrying the node path and Standard Schema
   issues. Every failure is also passed to Angular's `ErrorHandler`. Without any error component, the boundary renders
   nothing. The default error component is set with `withRendererConfig({ errorComponent })`.

Usage: `<ang-content-renderer [document]="document" />` (`ContentRenderer`). Changing `document` aborts pending loads
and replaces the rendered content; destroying the renderer destroys every created component. Created components use
the renderer's element and environment injectors and are attached to `ApplicationRef` for change detection. In prod
mode, unmatched input keys are skipped and content with unknown names is dropped instead of failing the boundary.

## Later

- Loader configuration (`DATA_LOADER_CONFIG`, `{ defaultLoader?: string }`), removed for now and to be added back
  through the loader providers (`provideDataLoaders`). With it, plain string `data` values return as
  `{ type: <defaultLoader>, url: <string> }` sources, along with its dev-mode checks.
- Definitions for design-system components (removed for now; previously the `design-system-definitions` entry point).
- Generics on definitions, loaders, and parsers inferred from their schemas, with a `defineContentComponent` helper
  that rejects, at compile time, an `initialValue` not matching its schema output.
- Helper types such as `InferContentConfig<TDefinition>` and `InferContentData<TData>`.
- Standard Schema validation of loader and parser config.

## Open questions

- Compile-time checking of config/data keys against component inputs (input aliases make this unreliable).
- Re-rendering and diffing when the document changes (nodes currently have no `key`).
- Whether loaders' `load` (and `fromAsyncValue`) should also accept Angular `Resource` or `Signal`.
- Final library name.
