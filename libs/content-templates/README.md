# @atlasng/content-templates

Render AtlasNG components dynamically from deserialized JSON content documents.

- `ContentDocument` and `ContentElementNode` describe the JSON input.
- `ContentComponentDefinition` (created with `defineContentComponent`) describes how a node's component is loaded
  and how its config and data are validated with [Standard Schema](https://standardschema.dev/).
