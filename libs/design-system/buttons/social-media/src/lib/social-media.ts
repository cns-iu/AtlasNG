import { ChangeDetectionStrategy, Component, computed, inject, InjectionToken, input, Provider } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';

/**
 * Definition for a single social media button.
 *
 * Rendering supports two icon strategies:
 * - Set `icon` to render a `mat-icon` using `[svgIcon]`.
 * - Omit `icon` and set `classes` so CSS can apply a mask icon
 *   (for example one of the built-in class names).
 */
export interface SocialMediaButtonDef {
  /** Key used for `id`-based lookup. */
  id: string;
  /** Accessible label for the anchor button. */
  label: string;
  /** Destination URL for the external social media link. */
  url: string;
  /** CSS classes applied to the icon element. Can be used to create a mask icon instead of an SVG icon. */
  classes?: string | string[];
  /** Svg icon name registered with `MatIconRegistry` to render within the button. */
  icon?: string;
}

/** DI token for optional application-specific button definitions. */
const SOCIAL_MEDIA_BUTTON_DEFS = new InjectionToken<SocialMediaButtonDef[]>('SOCIAL_MEDIA_BUTTON_DEFS');

/** Built-in definitions used when no matching injected definition exists. */
export const DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS: SocialMediaButtonDef[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/',
    classes: ['linkedin'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/',
    classes: ['youtube'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/',
    classes: ['instagram'],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    url: 'https://www.facebook.com/',
    classes: ['facebook'],
  },
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/',
    classes: ['github'],
  },
  {
    id: 'bluesky',
    label: 'Bluesky',
    url: 'https://bsky.app/',
    classes: ['bluesky'],
  },
  {
    id: 'x',
    label: 'X (formerly Twitter)',
    url: 'https://twitter.com/',
    classes: ['x'],
  },
];

/** Fallback definition used in production when no candidate resolves. */
const FALLBACK_SOCIAL_MEDIA_BUTTON_DEF: SocialMediaButtonDef = {
  id: '',
  label: 'Not available',
  url: '#',
  icon: 'error',
};

/**
 * Registers custom button definitions for `id`-based resolution.
 *
 * @param defs Array of button definitions to register.
 * @return Provider to include in the application module or component providers.
 */
export function provideSocialMediaButtons(defs: SocialMediaButtonDef[]): Provider {
  return { provide: SOCIAL_MEDIA_BUTTON_DEFS, useValue: defs };
}

@Component({
  selector: 'ang-social-media-button',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './social-media.html',
  styleUrl: './social-media.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideEventScope('social-media-button')],
})
export class SocialMediaButton {
  /** Identifier used to resolve a definition from injected or built-in sets. */
  readonly id = input<string>();

  /** Explicit definition with precedence over any `id`-based resolution. */
  readonly def = input<SocialMediaButtonDef>();

  /** Resolved definition from either `def` input or `id` lookup. */
  protected readonly resolvedDef = computed(() => {
    for (const def of this.getDefCandidates()) {
      if (def) {
        return def;
      }
    }

    return FALLBACK_SOCIAL_MEDIA_BUTTON_DEF;
  });

  /** Optional custom definitions provided via dependency injection. */
  private readonly defs = inject(SOCIAL_MEDIA_BUTTON_DEFS, { optional: true });

  /**
   * Yields candidate definitions in precedence order:
   * 1) explicit `def` input
   * 2) injected definition matching `id`
   * 3) built-in definition matching `id`
   *
   * In dev mode, missing inputs or unresolved `id` will throw.
   */
  private *getDefCandidates(): Iterable<SocialMediaButtonDef | undefined> {
    yield this.def();

    const id = this.id();
    if (!id && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw new Error('SocialMediaButton requires an id or def input');
    }

    yield this.defs?.find((d) => d.id === id);
    yield DEFAULT_SOCIAL_MEDIA_BUTTON_DEFS.find((d) => d.id === id);

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw new Error(`No definition found for SocialMediaButton with id "${id}"`);
    }
  }
}
