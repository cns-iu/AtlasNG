# @atlasng/content-templates

Render AtlasNG components dynamically from deserialized JSON content documents.

- `ContentDocument` and `ContentElementNode` describe the JSON input.
- `ContentDefinition` describes how a node's component is loaded
  and how its config and data are validated with [Standard Schema](https://standardschema.dev/).

## Entry points

| Entry point                              | Contents                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `@atlasng/content-templates`             | `provideContentTemplates` and its features, `ContentOutlet`                           |
| `@atlasng/content-templates/types`       | Shared document, definition, and data loader/parser types                             |
| `@atlasng/content-templates/definitions` | Definition registry and `provideDefinitions`                                          |
| `@atlasng/content-templates/loaders`     | Built-in data loaders and the data loader registry                                    |
| `@atlasng/content-templates/parsers`     | Built-in data parsers and the data parser registry                                    |
| `@atlasng/content-templates/utils`       | `ContentValidationError`, document guards, `passthroughSchema`, `LazyChainedRegistry` |

The primary entry point does not re-export the secondary entry points; import shared types from `/types` and built-in
loaders and parsers from `/loaders` and `/parsers`.

## Usage

Register definitions, and optionally loaders, parsers, and configuration:

```ts
provideContentTemplates(
  { errorComponent: ContentError },
  withDefinitions([headingDefinition]),
  withDefinitions({ table: () => import('./table.definition').then((m) => m.tableDefinition) }),
  withDataLoaders({ csv: () => inject(CsvLoader) }),
);
```

Render a document with `ContentOutlet`, as an element or on an element of your choice:

```html
<ang-content-outlet [document]="document" />
<article angContentOutlet [document]="document"></article>
```

Definitions load first. A node's component, config, and data load once its definition is known, so nothing is fetched
for invalid nodes. Data values are signals: later emissions of a loader re-render the component. Nodes whose definition
declares a `placeholderComponent` show it until their content is ready; failures show the definition's
`errorComponent`, or the configured one, and are reported to Angular's `ErrorHandler`. See [PLAN.md](PLAN.md) for the
full design.
