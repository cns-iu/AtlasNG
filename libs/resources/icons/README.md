# @atlasng/icons

Organ, product, and miscellaneous AtlasNG icons, packaged as an icon font with ligatures, an SVG sprite, SVG files, and SVG string literals.

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

Register the icons with `provideAngIcons` from `@atlasng/design-system/icons`:

```ts
import { provideAngIcons } from '@atlasng/design-system/icons';
import * as literals from '@atlasng/icons/literals';

provideAngIcons(); // font ligatures only: <mat-icon fontSet="ang-icons" fontIcon="heart" /> or <mat-icon fontSet="ang-icons">heart</mat-icon>
provideAngIcons({ spriteUrl: 'assets/ang-icons/sprite.svg' }); // SVG sprite: <mat-icon svgIcon="ang:heart" />
provideAngIcons({ literals }); // SVG literals bundled with the app: <mat-icon svgIcon="ang:heart" />
```

For the sprite, copy it into the application's assets in `angular.json` (or `project.json`):

```json
{ "glob": "sprite.svg", "input": "node_modules/@atlasng/icons", "output": "assets/ang-icons" }
```

Without the design system, register the icons with `MatIconRegistry` directly:

```ts
const registry = inject(MatIconRegistry);
const sanitizer = inject(DomSanitizer);
registry.registerFontClassAlias('ang-icons', 'ang-icon');
registry.addSvgIconSetInNamespace('ang', sanitizer.bypassSecurityTrustResourceUrl('assets/ang-icons/sprite.svg'));
registry.addSvgIconLiteralInNamespace('ang', 'heart', sanitizer.bypassSecurityTrustHtml(angIconHeart));
```

## Other files

- `svg/<category>/<name>.svg`: optimized SVGs
- `manifest.json` and `@atlasng/icons/manifest`: icon names, categories, codepoints, and paths, plus `IconName` and `IconCategory` types
- `files/ang-icons.woff2`: the font (family `AtlasNG Icons`)

## Adding icons

1. Export the 24x24 frame from Figma as SVG, with the artwork inside the frame, **Clip content** off, strokes outlined, a black fill, and no images. Union and flatten the artwork first; overlapping shapes cut holes in the font glyph.
2. Save it as `src/svg/<category>/<name>.svg`, where the category is `organs`, `products`, or `misc` and the name is kebab-case and unique across categories.
3. Run `npx nx run icons:codepoints` and commit `src/codepoints.json`. Codepoints are never reused; removed icons move to `retired`.
4. Run `npx nx build icons` and `npx nx test icons`.
