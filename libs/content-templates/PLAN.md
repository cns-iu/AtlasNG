# Content templates plan

`@atlasng/content-templates` (name provisional) renders components dynamically from a deserialized JSON document.
Async work happens in several places: definition lookup, lazy component imports, and per-node data loading.

## Status

| Phase                                                  | State                      |
| ------------------------------------------------------ | -------------------------- |
| 1. JSON document and definition contracts              | Done (types in `src/lib/`) |
| 2. Registry providers (`provideContentTemplates`)      | Next                       |
| 3. Resolver (eager loading + validation)               | Planned                    |
| 4. Renderer, outlet host, boundaries, errors           | Planned                    |
| 5. Built-in loaders/parsers, design-system definitions | Planned                    |

## Decisions

- **Location:** its own library with the `layer:content-templates` tag. It may import design-system, analytics, cdk,
  common, and core; labs may import it.
- **Rendering model (hybrid):** a node's subtree is fully resolved before the node is created, _except_ for nodes whose
  definition declares a `placeholder`. Those nodes are async boundaries: an outlet host renders the placeholder
  immediately and swaps in the real subtree once it is ready.
- **Eager loading:** when a document arrives, definitions, components, and data for _every_ node start loading in
  parallel, regardless of tree position. Boundaries only decide _when_ content is shown.
- **Validation:** config and data are validated with [Standard Schema](https://standardschema.dev/) compatible schemas
  (`@standard-schema/spec`, types only). No schema library is a dependency.
- **Bindings:** derived from `reflectComponentType`; definitions do not declare inputs.
- **Slots:** definitions map friendly slot names to `ng-content` selectors (`slots`, e.g. `{ content: '*' }`) and name
  the slot for unkeyed content (`defaultSlot`, e.g. `content`).
- **Types stay simple for now:** definitions, loaders, and parsers are loosely typed. Schema-driven generics and
  inference helpers are deferred (see [Later](#later)).

## 1. JSON document (`content-document.ts`)

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
  loader: string | { type: string; [key: string]: JsonValue };
  parser?: string | { type: string; [key: string]: JsonValue };
}
```

Discrimination rules (`isContentElementNode`, `isContentDataSource`):

- `content`: string -> text node; array -> node list; object **with** `component` -> single node (all three target
  the default slot); object **without** `component` -> slot record. A slot therefore cannot be named `component`.
- `data`: string -> `{ source: <string> }` config for the configured default loader (no default configured ->
  dev-mode error); array -> inline data used as is; object -> `ContentDataSource`. Inline objects use the built-in
  `inline` loader: `{ "loader": { "type": "inline", "value": { ... } } }`.
- `loader` / `parser`: a string names a registered loader/parser; an object names it in `type` and is itself the
  config (passed as is, `type` included).
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
            "rows": { "loader": { "type": "http", "url": "/api/sales.csv" }, "parser": "csv" },
            "columns": [{ "id": "region" }, { "id": "total" }],
            "summary": "/api/summary.json"
          }
        }
      }
    }
  ]
}
```

## 2. Component definition (`content-component-definition.ts`)

```ts
type ComponentOrLoader<T> = Type<T> | (() => Promisable<Type<T> | DefaultExport<Type<T>>>);

type ContentComponentConfigSchema =
  | StandardSchemaV1<JsonObject, object> // whole config object
  | Record<string, StandardSchemaV1<JsonValue, unknown>>; // one schema per config key

type ContentComponentDataSchema = Record<string, 'any' | StandardSchemaV1<unknown> | { schema: 'any' | StandardSchemaV1<unknown>; defaultValue?: unknown }>;

interface ContentComponentDefinition<TComponent = unknown> {
  name: string; // matches ContentElementNode.component
  component: ComponentOrLoader<TComponent>;
  config?: ContentComponentConfigSchema; // absent -> node must not provide config
  data?: ContentComponentDataSchema; // unknown data keys are errors
  slots?: Record<string, string>; // friendly name -> ng-content selector, e.g. { content: '*' }
  defaultSlot?: string; // key of `slots` receiving unkeyed content, e.g. 'content'
  placeholder?: Type<unknown>; // sync; makes the node an async boundary
  error?: ComponentOrLoader<unknown>; // falls back to the renderer default
}

const tableDefinition: ContentComponentDefinition = {
  name: 'table',
  component: () => import('@atlasng/design-system/table').then((m) => m.Table),
  config: { caption: optional(string()) },
  data: {
    rows: array(record(string(), unknown())),
    columns: { schema: array(columnSchema), defaultValue: [] },
  },
  placeholder: TablePlaceholder,
};
```

- Config: a single object schema validates the whole config; a per-key record validates each key, and keys without a
  schema are errors.
- Data: `'any'` skips validation. Missing data uses `defaultValue` if present, otherwise `undefined` is validated, so
  the schema decides optionality.
- `ComponentOrLoader` distinguishes a class from a loader with `reflectComponentType`. Only components are lazy,
  because a plain function cannot be told apart from a loader returning one.

### Bindings and slots

- **Inputs:** `{ ...configOutput, ...dataOutputs }` is keyed by input _template name_ and matched against
  `mirror.inputs[].templateName`. Each match becomes `inputBinding(propName, () => value)`. Unmatched keys and
  config/data key collisions are dev-mode errors; unbound required inputs surface Angular's own error.
- **Slots:** `mirror.ngContentSelectors` gives the projection indices. A slot key is looked up in `slots` and its
  selector matched against those indices. Unkeyed content goes to `defaultSlot`. Unknown slot keys, selectors missing
  from the component, and unkeyed content without a `defaultSlot` are dev-mode errors.
- **Placeholder and error components:** inputs are bound only if reflection shows them. A placeholder receives the
  boundary's `ContentElementNode` in a `node` input and its `ContentComponentDefinition` in a `definition` input. An
  error component (the definition's or the renderer default) receives the same, plus the thrown value in an `error`
  input. `definition` is `undefined` when the definition lookup itself failed. Missing inputs are skipped silently.

## 3. Data loaders and parsers (`content-data.ts`)

```ts
type AsyncValue<T> = T | Promise<T> | Observable<T>;

interface ContentDataLoader<TConfig = Record<string, JsonValue>, TResult = unknown> {
  load(config: TConfig, context: ContentDataContext): AsyncValue<TResult>;
}

interface ContentDataParser<TConfig = Record<string, JsonValue>, TInput = unknown, TOutput = unknown> {
  parse(input: TInput, config: TConfig, context: ContentDataContext): Promisable<TOutput>;
}

interface ContentDataContext {
  node: Readonly<ContentElementNode>;
  signal: AbortSignal; // aborted on document change / destroy
}
```

- Loaders and parsers carry no name; they are named at registration.
- `config` is the source's `loader` / `parser` object as is, `type` included, so no object is copied or modified. The
  string form is passed as `{ type: <name> }`. Config is not schema-validated for now.
- `load` and `parse` do not run in an injection context; dependencies are injected when the instance is created (see
  [Registration](#4-registration-phase-2)). Observables use their first emission.

## 4. Registration (phase 2)

Feature functions, following `provideLinkHandler(withX(), ...)` in `libs/common`:

```ts
provideContentTemplates(withDefinitions([contentHeaderDefinition, contentParagraphDefinition]), withLazyDefinitions({ table: () => import('./table.definition').then((m) => m.tableDefinition) }), withDataLoaders({ http: () => inject(HttpContentDataLoader), inline: () => new InlineContentDataLoader() }, { default: 'http' }), withDataParsers({ csv: () => new CsvContentDataParser() }));
```

Loaders and parsers are registered as factories. A factory runs once, lazily on first use, in the environment
injection context and returns the instance, so it can `inject()` dependencies.

Renderer-level config (default error component, dev-mode strictness) uses `createConfigurationToken` from
`libs/core/src/lib/configuration-token.ts`. An unknown `component` throws in dev mode, like the social-media-button
definition lookup (`libs/design-system/buttons/social-media-button/src/lib/social-media-button-definitions.ts`).

## 5. Rendering pipeline (phases 3-4)

1. **Eager resolve:** walk the whole tree. For every element node, start in parallel: definition lookup -> config
   validation; component load; and for each data entry, loader lookup -> load -> parser lookup -> parse -> schema
   validation. This produces a tree of per-node promises/signals. Nothing waits on its parent, so a parent's data
   cannot feed its children.
2. **Boundaries:** the renderer root is always a boundary, and every node with a `placeholder` starts a new one. A
   boundary is ready when all nodes in it (stopping at nested boundaries) are resolved.
3. **Creation (bottom-up, synchronous once a boundary is ready):** text -> `document.createTextNode`; element ->
   `createComponent(type, { bindings, projectableNodes, elementInjector })`; nested boundary -> an
   `ang-content-outlet` host (`display: contents`) created immediately with its placeholder and projected into the
   parent, which later renders the real node in its own `ViewContainerRef`. The `ComponentRef` lifecycle follows
   `libs/design-system/table/src/lib/definitions/template-definition-cache.ts`.
4. **Errors:** a failure propagates to the nearest boundary, which shows its `error` component (or the renderer
   default). Schema failures are wrapped in a `ContentValidationError` carrying the node path and Standard Schema
   issues.

## Later

- Generics on definitions, loaders, and parsers inferred from their schemas, with a `defineContentComponent` helper
  that rejects, at compile time, a `defaultValue` not matching its schema output.
- Helper types such as `InferContentConfig<TDefinition>` and `InferContentData<TData>`.
- Standard Schema validation of loader and parser config.

## Open questions

- Compile-time checking of config/data keys against component inputs (input aliases make this unreliable).
- Re-rendering and diffing when the document changes (nodes currently have no `key`).
- Whether `AsyncValue` should also accept Angular `Resource` or `Signal`.
- Final library name.
