import { indent, type OutputData } from '../../utils/output.ts';

/** Material core palettes, in output order. */
export const PALETTES = ['primary', 'secondary', 'tertiary', 'neutral', 'neutral-variant', 'error'] as const;

/** Name of a Material core palette. */
export type PaletteName = (typeof PALETTES)[number];

/** Tones every core palette must provide, in output order. */
export const TONES = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];

/** Additional tones the neutral palette must provide for surface colors. */
export const EXTRA_TONES = [4, 6, 12, 17, 22, 24, 87, 92, 94, 96];

/** Required tones of each core palette, in output order. */
export const TONES_BY_PALETTE: Record<PaletteName, readonly number[]> = {
  primary: TONES,
  secondary: TONES,
  tertiary: TONES,
  neutral: [...TONES, ...EXTRA_TONES],
  'neutral-variant': TONES,
  error: TONES,
};

/** Tones every extension palette must provide (read by the `ext-level-colors` mixin). */
export const EXT_TONES = [10, 20, 30, 40, 80, 90, 100];

/** Tones an extension palette's optional `variant` sub-palette must provide. */
export const EXT_VARIANT_TONES = [30, 80];

/** Matches flattened core palette keys such as `Primary 40` or `neutral-variant-90`. */
export const PALETTE_TONE_KEY_REGEX = /^(.+?)[\s-]+(\d+)$/i;

/** Matches numeric tone keys. */
export const TONE_REGEX = /^\d+$/;

/** Matches six-digit hex colors. */
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Sass exports appended after the core palettes map. */
export const SCSS_EXPORTS: OutputData = [
  '$_rest: (',
  indent([
    'secondary: map.get($_palettes, secondary),',
    'neutral: map.get($_palettes, neutral),',
    'neutral-variant: map.get($_palettes, neutral-variant),',
    'error: map.get($_palettes, error),',
  ]),
  ');',
  '',
  '$primary-palette: map.merge(map.get($_palettes, primary), $_rest);',
  '$tertiary-palette: map.merge(map.get($_palettes, tertiary), $_rest);',
  '',
];
