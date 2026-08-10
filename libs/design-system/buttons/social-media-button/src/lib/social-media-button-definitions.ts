import { InjectionToken, type Provider } from '@angular/core';

/** Properties shared by every social media button definition. */
interface SocialMediaButtonDefinitionBase {
  /** Key used for `id`-based lookup. */
  id: string;
  /** Accessible label for the anchor button. */
  label: string;
  /** Destination URL for the external social media link. */
  url: string;
}

/** Social media button definition rendered with an SVG icon. */
export interface SocialMediaButtonSvgIconDefinition extends SocialMediaButtonDefinitionBase {
  /** SVG icon name registered with `MatIconRegistry`. */
  icon: string;
  /** Font icons cannot be combined with an SVG icon. */
  fontIcon?: never;
  /** CSS classes applied to the icon element. */
  classes?: string | string[];
}

/** Social media button definition rendered with a font icon. */
export interface SocialMediaButtonFontIconDefinition extends SocialMediaButtonDefinitionBase {
  /** Font icon name rendered by `mat-icon`. */
  fontIcon: string;
  /** SVG icons cannot be combined with a font icon. */
  icon?: never;
  /** CSS classes applied to the icon element. */
  classes?: string | string[];
}

/** Social media button definition rendered through CSS classes. */
export interface SocialMediaButtonClassIconDefinition extends SocialMediaButtonDefinitionBase {
  /** CSS classes that provide a mask icon or other custom rendering. */
  classes: string | string[];
  /** No SVG icon is rendered when classes provide the icon. */
  icon?: never;
  /** No font icon is rendered when classes provide the icon. */
  fontIcon?: never;
}

/**
 * Definition for a social media button.
 *
 * Exactly one icon strategy is required. CSS classes may also be applied
 * when an SVG or font icon is used.
 */
export type SocialMediaButtonDefinition =
  SocialMediaButtonSvgIconDefinition | SocialMediaButtonFontIconDefinition | SocialMediaButtonClassIconDefinition;

/** DI token for optional application-specific button definitions. */
export const SOCIAL_MEDIA_BUTTON_DEFINITIONS = new InjectionToken<SocialMediaButtonDefinition[]>(
  'SOCIAL_MEDIA_BUTTON_DEFINITIONS',
);

/** Built-in definitions used when no matching injected definition exists. */
export const DEFAULT_SOCIAL_MEDIA_BUTTON_DEFINITIONS: SocialMediaButtonDefinition[] = [
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
export const FALLBACK_SOCIAL_MEDIA_BUTTON_DEFINITION: SocialMediaButtonDefinition = {
  id: '',
  label: 'Not available',
  url: '#',
  classes: ['ang-social-media-button--fallback'],
  fontIcon: 'error',
};

/**
 * Registers custom button definitions for `id`-based resolution.
 *
 * @param definitions Button definitions to register.
 * @returns Provider to include in application or component providers.
 */
export function provideSocialMediaButtons(definitions: SocialMediaButtonDefinition[]): Provider {
  return { provide: SOCIAL_MEDIA_BUTTON_DEFINITIONS, useValue: definitions };
}
