# internal-storybook

This internal library provides the shared Storybook configuration and themes for AtlasNG. It also hosts the composition Storybook that combines the design-system, labs, kg-explorer, and content-blocks Storybooks.

Start the full local composition with:

```sh
npx nx storybook internal-storybook
```

Nx starts every referenced Storybook before the composition. The local ports are:

| Storybook      | Port |
| -------------- | ---: |
| Composition    | 4400 |
| design-system  | 4401 |
| labs           | 4402 |
| content-blocks | 4403 |
| kg-explorer    | 4404 |

## Theme SCSS

The `src/themes/<theme>/_palettes.scss`, `_shape.scss`, and `_typography.scss` files are generated from the theme's Figma `*.tokens.json` files. Regenerate them with:

```sh
npx nx run internal-storybook:generate-palettes-scss:<theme>
npx nx run internal-storybook:generate-shape-scss:<theme>
npx nx run internal-storybook:generate-typography-scss:<theme>
```
