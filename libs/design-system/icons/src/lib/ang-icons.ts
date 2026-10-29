import {
  type EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

/** Font set alias used with `<mat-icon fontSet="ang-icons">`. */
export const ANG_ICONS_FONT_SET = 'ang-icons';

/** CSS class defined by `@atlasng/icons` that applies the icon font. */
export const ANG_ICONS_FONT_CLASS = 'ang-icon';

/** Default namespace for SVG icons, used as `<mat-icon svgIcon="ang:<name>">`. */
export const ANG_ICONS_NAMESPACE = 'ang';

/** Prefix of the SVG literal exports in `@atlasng/icons/literals`, e.g. `angIconHeart`. */
export const ANG_ICONS_LITERAL_PREFIX = 'angIcon';

/** Options for {@link provideAngIcons}. */
export interface AngIconsOptions {
  /**
   * URL of `sprite.svg` from `@atlasng/icons`, copied into the application's assets.
   * When set, every icon in the sprite is available as `svgIcon="<namespace>:<name>"`.
   * The sprite is fetched lazily with `HttpClient` the first time an icon is requested.
   */
  spriteUrl?: string;
  /**
   * SVG string literals from `@atlasng/icons/literals`, keyed either by icon name
   * (`{ heart: angIconHeart }`) or by export name (`import * as icons from '@atlasng/icons/literals'`).
   * Export names are converted with {@link toAngIconName}.
   */
  literals?: Readonly<Record<string, string>>;
  /** Namespace for the sprite and literals. Defaults to {@link ANG_ICONS_NAMESPACE}. */
  namespace?: string;
}

/**
 * Converts an `@atlasng/icons/literals` export name to its icon name, e.g. `angIconLeftKidney` to `left-kidney`.
 * Keys without the {@link ANG_ICONS_LITERAL_PREFIX} prefix are treated as icon names and returned unchanged.
 *
 * Uppercase letters start a new segment and digits stay in the preceding segment, so a name with a
 * segment that starts with a digit (e.g. `organ-2`) cannot be recovered from its export name and must be
 * registered by icon name instead.
 *
 * @param key Icon name or literal export name.
 * @returns The kebab-case icon name.
 */
export function toAngIconName(key: string): string {
  if (!key.startsWith(ANG_ICONS_LITERAL_PREFIX) || key.length === ANG_ICONS_LITERAL_PREFIX.length) {
    return key;
  }

  const pascal = key.slice(ANG_ICONS_LITERAL_PREFIX.length);
  return pascal.replace(/(?!^)([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Registers the `@atlasng/icons` icon font, SVG sprite, and SVG literals with `MatIconRegistry`.
 *
 * The icon assets come from `@atlasng/icons`: import its CSS (`@atlasng/icons` or `@atlasng/icons/font-face.css`)
 * for the font, copy its `sprite.svg` into the application's assets for `spriteUrl`, and import
 * `@atlasng/icons/literals` for `literals`. The font set alias is always registered, so
 * `<mat-icon fontSet="ang-icons">heart</mat-icon>` works once the CSS is loaded.
 *
 * May be provided several times, for example with different namespaces.
 *
 * @param options Sprite URL, literals, and namespace to register.
 * @returns Providers to include in the application or route providers.
 */
export function provideAngIcons(options: AngIconsOptions = {}): EnvironmentProviders {
  const { spriteUrl, literals = {}, namespace = ANG_ICONS_NAMESPACE } = options;

  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const registry = inject(MatIconRegistry);
      const sanitizer = inject(DomSanitizer);

      registry.registerFontClassAlias(ANG_ICONS_FONT_SET, ANG_ICONS_FONT_CLASS);

      if (spriteUrl) {
        registry.addSvgIconSetInNamespace(namespace, sanitizer.bypassSecurityTrustResourceUrl(spriteUrl));
      }

      for (const [key, svg] of Object.entries(literals)) {
        registry.addSvgIconLiteralInNamespace(namespace, toAngIconName(key), sanitizer.bypassSecurityTrustHtml(svg));
      }
    }),
  ]);
}
