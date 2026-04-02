# AtlasNG

An Angular monorepo providing a suite of libraries for building consistent, accessible, and analytics-aware applications.

## Packages

| Package                                                  | Description                                               |
| -------------------------------------------------------- | --------------------------------------------------------- |
| [`@atlasng/analytics`](libs/analytics/README.md)         | User interaction logging and privacy consent management   |
| [`@atlasng/cdk`](libs/cdk/README.md)                     | Low-level primitives: overlays, portals, focus management |
| [`@atlasng/common`](libs/common/README.md)               | Shared pipes, directives, guards, and utilities           |
| [`@atlasng/core`](libs/core/README.md)                   | Platform bootstrap, environment config, and DI tokens     |
| [`@atlasng/design-system`](libs/design-system/README.md) | UI component catalog, design tokens, and theming          |

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Install dependencies

```sh
npm install
```

### Serve the demo application

```sh
npx nx serve AtlasNG
```

### Build

```sh
# Build all projects
npx nx run-many -t build

# Build a specific library
npx nx test analytics
```

### Test

```sh
# Run tests for all projects
npx nx run-many -t test

# Run tests for a specific library
npx nx test analytics
```

### Lint

```sh
npx nx run-many -t lint
```

## License

[MIT](LICENSE)
