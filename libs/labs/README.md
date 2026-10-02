# @atlasng/labs

Experimental AtlasNG components that are still being designed. Labs APIs may change or be removed in any release, including patch releases; components that stabilize move to [`@atlasng/design-system`](../design-system/README.md).

Preview the components in the [AtlasNG Storybook](https://cns-iu.github.io/AtlasNG/).

## Installation

```bash
npm install @atlasng/labs
```

Labs builds on `@atlasng/design-system`, so follow its [setup steps](../design-system/README.md#setup) first.

## Components

| Entry point                            | Exports                                                |
| -------------------------------------- | ------------------------------------------------------ |
| `@atlasng/labs/cookie-modal`           | `CookieModal` and its data and provider types          |
| `@atlasng/labs/grid-container`         | `GridContainer`                                        |
| `@atlasng/labs/header-shell`           | `HeaderShell`, `NavigationMenu`, `NavigationContainer` |
| `@atlasng/labs/skip-to-content-button` | `SkipToContentButton`                                  |

Token override mixins (`cookie-modal-overrides`, `header-shell-overrides`, and `skip-to-content-button-overrides`) are available through `@use '@atlasng/labs' as labs;`.
