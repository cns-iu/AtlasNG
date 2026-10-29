# @atlasng/icons

Organ, product, and miscellaneous AtlasNG icons, packaged as an icon font with ligatures, an SVG sprite, SVG files, and SVG string literals.

> The icons currently shipped are simple geometric placeholders until the final artwork is exported from Figma.

## Installation

```bash
npm install @atlasng/icons
```

## CSS

```ts
import '@atlasng/icons'; // @font-face, .ang-icon, and .ang-icon--<name> classes
```

```scss
@use '@atlasng/icons/scss' as icons;

@include icons.font-face('/assets/ang-icons'); // or import '@atlasng/icons/font-face.css'

.organ {
  @include icons.ang-icon('heart');
}
```

```html
<span class="ang-icon">heart</span>
<!-- ligature -->
<span class="ang-icon ang-icon--heart"></span>
<!-- class -->
```

Colour is lost in the font; glyphs render in the current text colour. The sprite, SVG files, and literals use `currentColor` for black fills and keep other colours.

## Angular Material `mat-icon`

### Font ligatures

```ts
inject(MatIconRegistry).registerFontClassAlias('ang-icons', 'ang-icon');
```

```html
<mat-icon fontSet="ang-icons" fontIcon="heart" />
```

### SVG sprite

Copy the package files into the application's assets in `angular.json` (or `project.json`):

```json
{ "glob": "sprite.svg", "input": "node_modules/@atlasng/icons", "output": "assets/ang-icons" }
```

```ts
inject(MatIconRegistry).addSvgIconSetInNamespace(
  'ang',
  inject(DomSanitizer).bypassSecurityTrustResourceUrl('assets/ang-icons/sprite.svg'),
);
```

```html
<mat-icon svgIcon="ang:heart" />
```

### SVG literals

```ts
import { angIconHeart } from '@atlasng/icons/literals'; // or '@atlasng/icons/literals/heart'

inject(MatIconRegistry).addSvgIconLiteralInNamespace(
  'ang',
  'heart',
  inject(DomSanitizer).bypassSecurityTrustHtml(angIconHeart),
);
```

## Other files

- `svg/<category>/<name>.svg`: optimized SVGs
- `manifest.json` and `@atlasng/icons/manifest`: icon names, categories, codepoints, and paths, plus `IconName` and `IconCategory` types
- `files/ang-icons.woff2`: the font (family `AtlasNG Icons`)

## Adding icons

1. Export from Figma as SVG from a 24x24 frame, with strokes outlined, a single colour, and no images.
2. Save it as `src/svg/<category>/<name>.svg`, where the category is `organs`, `products`, or `misc` and the name is kebab-case and unique across categories.
3. Run `npx nx run icons:codepoints` and commit `src/codepoints.json`. Codepoints are never reused; removed icons move to `retired`.
4. Run `npx nx build icons` and `npx nx test icons`.
