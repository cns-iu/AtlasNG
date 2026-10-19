# @atlasng/content-templates

Render AtlasNG components dynamically from deserialized JSON content documents.

- `ContentDocument` and `ContentElementNode` describe the JSON input.
- `ContentDefinition` describes how a node's component is loaded
  and how its config and data are validated with [Standard Schema](https://standardschema.dev/).

## Entry points

| Entry point                              | Contents                                                          |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `@atlasng/content-templates`             | `provideContentTemplates` and its features, resolver, renderer    |
| `@atlasng/content-templates/types`       | Shared document, definition, and data loader/parser types         |
| `@atlasng/content-templates/definitions` | Definition registry and `provideDefinitions`                      |
| `@atlasng/content-templates/loaders`     | Built-in data loaders and the data loader registry                |
| `@atlasng/content-templates/parsers`     | Built-in data parsers and the data parser registry                |
| `@atlasng/content-templates/utils`       | Shared runtime helpers, e.g. the `LazyChainedRegistry` base class |

The primary entry point does not re-export the secondary entry points; import shared types from `/types` and built-in
loaders and parsers from `/loaders` and `/parsers`.
