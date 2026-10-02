# @atlasng/design-system

Angular components and Sass theming utilities that implement the AtlasNG design language. Components are standalone, built on Angular Material, and styled through Material 3 system tokens, so they follow whatever Material theme your application defines.

Browse the components in the [AtlasNG Storybook](https://cns-iu.github.io/AtlasNG/).

## Installation

```bash
npm install @atlasng/design-system
```

The package's peer dependencies are `@angular/material`, `@angular/cdk`, `@angular/youtube-player`, `@swimlane/ngx-datatable`, `@atlasng/analytics`, `@atlasng/common`, and `@atlasng/core`. Install any your package manager does not add automatically.

## Setup

1. **Define a Material theme.** Components read `--mat-sys-*` variables, so include `mat.theme` in your global styles as described in the [Angular Material theming guide](https://material.angular.dev/guide/theming).
2. **Configure link handling.** Components that render links use `AnyLink` from `@atlasng/common`. With the Angular Router, add `provideLinkHandler(withRouterHandler())`; without it, the native-navigation default needs no setup.
3. **Configure analytics.** Several components log interactions through `@atlasng/analytics`. Add `provideAnalytics(...)` to send events, as described in the [analytics README](../analytics/README.md).

## Components

Every component has its own secondary entry point, so you only bundle what you import.

| Entry point                                                  | Exports                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `@atlasng/design-system/buttons/breadcrumbs`                 | `Breadcrumbs`                                                             |
| `@atlasng/design-system/buttons/help-button`                 | `HelpButton`                                                              |
| `@atlasng/design-system/buttons/navigation-button`           | `NavigationButton`                                                        |
| `@atlasng/design-system/buttons/navigation-toggle`           | `NavigationToggle`                                                        |
| `@atlasng/design-system/buttons/social-media-button`         | `SocialMediaButton`, `provideSocialMediaButtons`                          |
| `@atlasng/design-system/cards/basic-profile-card`            | `BasicProfileCard`                                                        |
| `@atlasng/design-system/cards/brand-profile-card`            | `BrandProfileCard`, `BrandProfileCardAction`                              |
| `@atlasng/design-system/content/content-header`              | `ContentHeader`                                                           |
| `@atlasng/design-system/content/content-paragraph`           | `ContentParagraph`                                                        |
| `@atlasng/design-system/content/content-section`             | `ContentSection`                                                          |
| `@atlasng/design-system/content/heading`                     | `Heading`                                                                 |
| `@atlasng/design-system/cookie-banner`                       | `CookieBanner` and its content directives                                 |
| `@atlasng/design-system/error-page`                          | `ErrorPage` and its content directives, `NotFoundPage`, `ServerErrorPage` |
| `@atlasng/design-system/footer`                              | `Footer`                                                                  |
| `@atlasng/design-system/indicators/end-of-results-indicator` | `EndOfResultsIndicator`                                                   |
| `@atlasng/design-system/indicators/no-results-indicator`     | `NoResultsIndicator`                                                      |
| `@atlasng/design-system/indicators/notice`                   | `Notice`                                                                  |
| `@atlasng/design-system/indicators/results-indicator`        | `ResultsIndicator`                                                        |
| `@atlasng/design-system/links/link-snippet`                  | `LinkSnippet`                                                             |
| `@atlasng/design-system/links/text-link`                     | `TextLink`                                                                |
| `@atlasng/design-system/snackbar`                            | `Snackbar`                                                                |
| `@atlasng/design-system/table`                               | `Table` and its column and template APIs                                  |
| `@atlasng/design-system/table/columns`                       | Ready-made header and cell definitions                                    |
| `@atlasng/design-system/table-of-contents`                   | `TableOfContents`                                                         |
| `@atlasng/design-system/youtube-player`                      | `YouTubePlayer`, `provideYouTubePlayerConfig`                             |

```ts
import { Component } from '@angular/core';
import { Notice } from '@atlasng/design-system/indicators/notice';

@Component({
  selector: 'app-maintenance',
  imports: [Notice],
  template: `<ang-notice variant="warning">…</ang-notice>`,
})
export class Maintenance {}
```

A few components with notable options:

- **Table:** `Table` wraps `@swimlane/ngx-datatable`. Text and number headers, plus checkbox, number, link, and code cells, are available from `@atlasng/design-system/table/columns`. Tables default to the `stripes` appearance and also support `grid`, `vertical-rules`, and `none`.
- **Notice:** highlights static page content in the `info` (default), `success`, `warning`, `critical`, or `unavailable` variant. The non-default variants use the extended level colors described below.

## Sass API

Load the Sass API with `@use '@atlasng/design-system' as ds;`.

### Token overrides

Each component exposes an `<component>-overrides` mixin that sets its `--ang-<component>-*` CSS variables. Use it at the root of a stylesheet to change the component everywhere, or inside a selector to scope the change. Unknown token names are a compile-time error.

```scss
@use '@atlasng/design-system' as ds;

:root {
  @include ds.notice-overrides(
    (
      container-shape: 0,
    )
  );
}

.dark-footer {
  @include ds.footer-overrides(
    (
      background-color: #1c1b1f,
    )
  );
}
```

The available tokens for each component are listed in its [token file](src/sass/tokens).

### Material defaults

Some AtlasNG components pair with Angular Material components that use different default tokens. Include `ds.mat-all-defaults()` once in your theme to apply them, or include `ds.mat-button-defaults()` or `ds.mat-form-field-defaults()` individually.

### Breakpoints

The `breakpoint` mixin and function generate media queries from named widths (`x-small` 0, `small` 600px, `medium` 960px, `large` 1280px, `x-large` 1920px). Add `only` or `down` to change the range; the default range is that width and up.

```scss
@include ds.breakpoint(medium) {
  /* 960px and wider */
}
@include ds.breakpoint(small only) {
  /* 600px to 959px */
}

@media screen and #{ds.breakpoint(medium down)} {
  /* custom media query */
}
```

Named breakpoints up to `$print-breakpoint` (default `large`) also apply to print. Configure `$breakpoints` and `$print-breakpoint` with `@use '@atlasng/design-system' as ds with (...)`.

### Extended level colors

`ext-level-colors($name, $palette, $theme-type)` emits status color roles that Angular Material does not provide, as `--ang-ext-*` CSS variables: `--ang-ext-<name>`, `--ang-ext-on-<name>`, `--ang-ext-<name>-container`, `--ang-ext-on-<name>-container`, and `--ang-ext-on-<name>-container-variant`. Include it next to `mat.theme`, once per level:

```scss
@use '@angular/material' as mat;
@use '@atlasng/design-system' as ds;

.light-theme {
  @include mat.theme($theme);
  @include ds.ext-level-colors(info, $info-palette, light);
}
```

Palettes need tones `10`, `20`, `30`, `40`, `80`, `90`, and `100`. The variant role reads tones `30` and `80` from an optional nested `variant` sub-palette and otherwise from the palette itself. `$theme-type` accepts `light`, `dark`, or `color-scheme` (which emits `light-dark()` values).

You don't have to define every level. A component that uses a level you haven't emitted falls back to a related Material role. For example, the `critical` notice uses `var(--ang-ext-critical, var(--mat-sys-error))`, so it follows the theme's error colors unless you emit a `critical` level.
