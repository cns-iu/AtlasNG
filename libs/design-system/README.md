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

### TODO: Component Catalog

### TODO: Design Tokens

### TODO: Theming
