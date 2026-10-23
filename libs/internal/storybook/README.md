# internal-storybook

This internal library provides the shared Storybook configuration and themes for AtlasNG. It also hosts the composition Storybook that combines the design-system, labs, kg-explorer, and content-templates Storybooks.

Start the full local composition with:

```sh
npx nx storybook internal-storybook
```

Nx starts every referenced Storybook before the composition. The local ports are:

| Storybook         | Port |
| ----------------- | ---: |
| Composition       | 4400 |
| design-system     | 4401 |
| labs              | 4402 |
| content-templates | 4403 |
| kg-explorer       | 4404 |
