/** Number of decimals kept when converting pixels to rem. */
export const REM_DECIMALS = 3;

/** Suffix that marks a variable font family name. */
export const VARIABLE_FONT_SUFFIX = ' Variable';

/** Material typescale style names, in output order. */
export const TYPESCALE_STYLES = [
  'body-large',
  'body-medium',
  'body-small',
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium',
  'headline-small',
  'label-large',
  'label-medium',
  'label-small',
  'title-large',
  'title-medium',
  'title-small',
] as const;

/** Typescale styles whose emphasized weight is written as `-weight-prominent`. */
export const PROMINENT_WEIGHT_STYLES: readonly string[] = ['label-large', 'label-medium'];

/**
 * Numeric font weights keyed by normalized weight name.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#common_weight_name_mapping
 */
export const WEIGHT_BY_NAME: Readonly<Record<string, number>> = {
  thin: 100,
  hairline: 100,
  'extra-light': 200,
  'ultra-light': 200,
  light: 300,
  regular: 400,
  normal: 400,
  medium: 500,
  'semi-bold': 600,
  semibold: 600,
  demibold: 600,
  bold: 700,
  'extra-bold': 800,
  'ultra-bold': 800,
  black: 900,
  heavy: 900,
};

/** Matches plain SCSS identifiers that need no quoting. */
export const SCSS_IDENTIFIER_REGEX = /^[-_a-zA-Z][-_a-zA-Z0-9]*$/;
