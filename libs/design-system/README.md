# @atlasng/design-system

An opinionated Angular UI component library that implements the AtlasNG design language. This library provides a cohesive set of accessible, themeable components, design tokens, and layout utilities for building consistent user interfaces across all AtlasNG applications.

## Overview

The design system enables teams to:

- **Use Ready-Made Components**: A catalog of accessible Angular components (buttons, inputs, modals, tables, and more) built on `@angular/material`
- **Apply Design Tokens**: Consistent color, typography, spacing, and elevation tokens exposed as CSS custom properties
- **Theme Applications**: Light and dark mode support with a theming API for customizing brand colors
- **Ensure Accessibility**: All components meet WCAG 2.1 AA requirements by default
- **Compose Layouts**: Flexible layout primitives for building responsive page structures

## Installation

```bash
npm install @atlasng/design-system
```

## Usage

### Configuration

Provide the design system in your application bootstrap:

```ts
import { provideDesignSystem } from '@atlasng/design-system';

bootstrapApplication(AppComponent, {
  providers: [provideDesignSystem()],
});
```

### Component Catalog

- Table: import `Table`, `TableColumn`, and its supporting API from
  `@atlasng/design-system/table`. Reusable text and number headers plus checkbox,
  number, link, and code cell definitions are available from
  `@atlasng/design-system/table/columns`. Tables default to the `stripes`
  appearance and also support `grid`, `vertical-rules`, and `none`.
- Notice: import `Notice` and `NoticeVariant` from
  `@atlasng/design-system/indicators/notice`. Notices highlight static page content
  and support the `info` (default), `success`, `warning`, `critical`, and
  `unavailable` variants.

### Extended Level Colors

`ext-level-colors($name, $palette, $theme-type)` emits status color roles that
Angular Material does not provide, as `--ang-ext-*` CSS variables:
`--ang-ext-<name>`, `--ang-ext-on-<name>`, `--ang-ext-<name>-container`,
`--ang-ext-on-<name>-container`, and `--ang-ext-on-<name>-container-variant`.
Include it next to `mat.theme`, once per level:

```scss
@use '@angular/material' as mat;
@use '@atlasng/design-system' as ds;

.light-theme {
  @include mat.theme($theme);
  @include ds.ext-level-colors(info, $info-palette, light);
}
```

Palettes need tones `10`, `20`, `30`, `40`, `80`, `90`, and `100`. The variant
role reads tones `30` and `80` from an optional nested `variant` sub-palette and
otherwise from the palette itself. `$theme-type` accepts `light`, `dark`, or
`color-scheme` (which emits `light-dark()` values).

Levels that map onto Material roles, such as `critical`, are not emitted by
default. Components that use them specify a Material fallback instead, for
example `color: token-utils.ext-slot(critical, token-utils.sys-slot(error))`.

### TODO: Design Tokens

### TODO: Theming
