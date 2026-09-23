# internal-storybook

This internal library provides the shared Storybook configuration and themes for AtlasNG. It also hosts the composition Storybook that combines the design-system, labs, and kg-explorer Storybooks.

Start the full local composition with:

```sh
npx nx storybook internal-storybook
```

Nx starts every referenced Storybook before the composition. The local ports are:

| Storybook     | Port |
| ------------- | ---: |
| Composition   | 4400 |
| design-system | 4401 |
| labs          | 4402 |
| kg-explorer   | 4403 |
