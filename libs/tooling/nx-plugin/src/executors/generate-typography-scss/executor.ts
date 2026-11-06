import { type ExecutorContext, logger } from '@nx/devkit';
import { relative, resolve } from 'node:path';
import {
  createScssBanner,
  type ExecutorResult,
  readTokensFile,
  resolveOutputPath,
  runExecutorTask,
  SCSS_INDENT,
  type TokensObject,
  writeScssFile,
} from '../../utils/scss.ts';

/** Options for the `generate-typography-scss` executor. */
export interface GenerateTypographyScssExecutorOptions {
  /** Path to the font tokens JSON file, relative to the workspace root. */
  input: string;
  /** Path to the typescale tokens JSON file, relative to the workspace root. */
  typescale: string;
  /** Path to the output SCSS file, relative to the workspace root. Defaults to `<input name>.typography.scss` next to the input. */
  output?: string;
  /** Whether to append ` Variable` to the plain font family name. */
  plainVariable?: boolean;
  /** Whether to append ` Variable` to the brand font family name. */
  brandVariable?: boolean;
}

/** Options that control variable font naming. */
export type VariableFontOptions = Pick<GenerateTypographyScssExecutorOptions, 'plainVariable' | 'brandVariable'>;

/** Font families and weights parsed from a font tokens file. */
export interface Typography {
  /** The plain (body) font family. */
  plainFamily: string;
  /** The brand (display) font family. */
  brandFamily: string;
  /** Numeric font weights keyed by kebab-case weight name. */
  weights: Record<string, number>;
}

/** A Material typescale style parsed from a typescale tokens file. */
export interface TypescaleStyle {
  /** Kebab-case style name, e.g. `body-large`. */
  name: string;
  /** Font family. */
  font: string;
  /** Numeric font weight. */
  weight: number;
  /** Font size in rem. */
  size: string;
  /** Line height in rem. */
  lineHeight: string;
  /** Letter spacing in rem. */
  tracking: string;
  /** Numeric emphasized font weight, when the style defines one. */
  prominentWeight?: number;
}

/** Number of decimals kept when converting pixels to rem. */
const REM_DECIMALS = 3;

/** Suffix that marks a variable font family name. */
const VARIABLE_FONT_SUFFIX = ' Variable';

/** Material typescale style names, in output order. */
export const TYPESCALE_STYLE_ORDER = [
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
const PROMINENT_WEIGHT_STYLES: readonly string[] = ['label-large', 'label-medium'];

/**
 * Numeric font weights keyed by normalized weight name.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight#common_weight_name_mapping
 */
const WEIGHT_BY_NAME: Readonly<Record<string, number>> = {
  thin: 100,
  hairline: 100,
  'extra light': 200,
  'ultra light': 200,
  light: 300,
  regular: 400,
  normal: 400,
  medium: 500,
  'semi bold': 600,
  semibold: 600,
  demibold: 600,
  bold: 700,
  'extra bold': 800,
  'ultra bold': 800,
  black: 900,
  heavy: 900,
};

/**
 * Generates `$typography` and `$typography-overrides` SCSS maps from Figma font and typescale tokens exports.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether the file was generated.
 */
export default async function generateTypographyScssExecutor(
  options: GenerateTypographyScssExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorResult> {
  return runExecutorTask(async () => {
    const outputPath = resolveOutputPath(context.root, options.input, options.output, '.typography.scss');
    const tokens = await readTokensFile(resolve(context.root, options.input));
    const typescaleTokens = await readTokensFile(resolve(context.root, options.typescale));
    const typography = parseTypography(tokens, options);
    const styles = parseTypescale(typescaleTokens, typography, options);
    const scss = buildScss(createScssBanner(context), options.input, options.typescale, typography, styles);

    await writeScssFile(outputPath, scss);
    logger.info(`Wrote ${relative(context.root, outputPath)}`);
  });
}

/**
 * Reads a token's `$value`.
 *
 * @param token The token, or any other value.
 * @returns The token's `$value`, or `undefined` when there is none.
 */
function getTokenValue(token: unknown): unknown {
  return (token as { $value?: unknown } | null | undefined)?.$value;
}

/**
 * Normalizes a weight name for lookup, dropping `italic` and treating `-`/`_` as spaces.
 *
 * @param name The weight name.
 * @returns The normalized name.
 */
function normalizeWeightName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bitalic\b/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a weight name to its numeric font weight.
 *
 * @param value The weight name from the token value.
 * @param fallbackName Name used when `value` is empty.
 * @returns The numeric weight, or `undefined` for unknown names.
 */
export function parseWeight(value: unknown, fallbackName: string): number | undefined {
  return WEIGHT_BY_NAME[normalizeWeightName(String(value || fallbackName))];
}

/**
 * Converts a weight token key to a kebab-case map key, dropping `italic`.
 *
 * @param name The token key.
 * @returns The map key.
 */
function toWeightKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bitalic\b/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Converts a typescale style name to kebab case.
 *
 * @param value The style name, e.g. `Body large`.
 * @returns The kebab-case name, e.g. `body-large`.
 */
function toKebabCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Formats a string as an SCSS value, quoting it unless it is a plain identifier.
 *
 * @param value The string.
 * @returns The SCSS identifier or quoted string.
 */
export function toScssString(value: string): string {
  if (/^[-_a-zA-Z][-_a-zA-Z0-9]*$/.test(value)) {
    return value;
  }

  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Converts a pixel value to rem, keeping at most {@link REM_DECIMALS} decimals without trailing zeros.
 *
 * @param value The value in pixels.
 * @returns The SCSS rem length.
 */
export function toRem(value: number): string {
  const fixed = (value / 16).toFixed(REM_DECIMALS);
  return `${fixed.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}rem`;
}

/**
 * Appends the variable font suffix to a font family name unless it is already present.
 *
 * @param fontName The font family name.
 * @returns The variable font family name.
 */
export function toVariableFontName(fontName: string): string {
  const trimmed = fontName.trim();
  return trimmed.toLowerCase().endsWith(VARIABLE_FONT_SUFFIX.toLowerCase())
    ? trimmed
    : `${trimmed}${VARIABLE_FONT_SUFFIX}`;
}

/**
 * Normalizes a font family name for comparison, ignoring case and the variable font suffix.
 *
 * @param fontName The font family name.
 * @returns The comparable name.
 */
function toComparableFontFamily(fontName: string): string {
  return fontName
    .trim()
    .replace(new RegExp(`${VARIABLE_FONT_SUFFIX}$`, 'i'), '')
    .trim()
    .toLowerCase();
}

/**
 * Checks whether a typescale font should use its variable font name.
 *
 * @param fontName The typescale font family.
 * @param typography The parsed typography.
 * @param options The variable font options.
 * @returns `true` when the font matches a family whose variable option is enabled.
 */
function shouldUseVariableFont(fontName: string, typography: Typography, options: VariableFontOptions): boolean {
  const font = toComparableFontFamily(fontName);
  return (
    (!!options.plainVariable && font === toComparableFontFamily(typography.plainFamily)) ||
    (!!options.brandVariable && font === toComparableFontFamily(typography.brandFamily))
  );
}

/**
 * Reads the font families and weights from a font tokens object.
 *
 * @param tokens The parsed font tokens file.
 * @param options The variable font options.
 * @returns The parsed typography.
 * @throws If `Static.Font.Plain`, `Static.Font.Brand` or `Static.Weight` is missing, or a weight name is unsupported.
 */
export function parseTypography(tokens: TokensObject, options: VariableFontOptions = {}): Typography {
  const staticTokens = tokens['Static'] as { Font?: Record<string, unknown>; Weight?: unknown } | undefined;
  const plainFamily = getTokenValue(staticTokens?.Font?.['Plain']);
  const brandFamily = getTokenValue(staticTokens?.Font?.['Brand']);

  if (typeof plainFamily !== 'string' || plainFamily.trim().length === 0) {
    throw new Error('Missing required token: Static.Font.Plain.$value');
  }

  if (typeof brandFamily !== 'string' || brandFamily.trim().length === 0) {
    throw new Error('Missing required token: Static.Font.Brand.$value');
  }

  const weightGroup = staticTokens?.Weight;
  if (!weightGroup || typeof weightGroup !== 'object') {
    throw new Error('Missing required token group: Static.Weight');
  }

  const weights: Record<string, number> = {};
  for (const [key, token] of Object.entries(weightGroup)) {
    const tokenName = getTokenValue(token);
    const weight = parseWeight(tokenName, key);
    if (weight === undefined) {
      throw new Error(`Unsupported typography weight name: ${String(tokenName ?? key)}`);
    }

    weights[toWeightKey(key)] = weight;
  }

  return {
    plainFamily: options.plainVariable ? toVariableFontName(plainFamily) : plainFamily.trim(),
    brandFamily: options.brandVariable ? toVariableFontName(brandFamily) : brandFamily.trim(),
    weights,
  };
}

/**
 * Reads the Material typescale styles from a typescale tokens object.
 * Entries without a string `Font`/`Weight` and numeric `Size`/`Line height`/`Tracking` are skipped.
 *
 * @param tokens The parsed typescale tokens file.
 * @param typography The parsed typography, used to resolve variable font names.
 * @param options The variable font options.
 * @returns The styles, in {@link TYPESCALE_STYLE_ORDER}.
 * @throws If `Static` is missing, no Material style is found, or a weight name is unsupported.
 */
export function parseTypescale(
  tokens: TokensObject,
  typography: Typography,
  options: VariableFontOptions = {},
): TypescaleStyle[] {
  const staticTokens = tokens['Static'];
  if (!staticTokens || typeof staticTokens !== 'object') {
    throw new Error('Missing required token group: Static');
  }

  const styles = new Map<string, TypescaleStyle>();
  for (const [rawStyleName, styleTokens] of Object.entries(staticTokens as Record<string, unknown>)) {
    const style = parseTypescaleStyle(rawStyleName, styleTokens, typography, options);
    if (style) {
      styles.set(style.name, style);
    }
  }

  if (styles.size === 0) {
    throw new Error('No valid typescale styles were found in the provided typescale tokens file.');
  }

  const ordered = TYPESCALE_STYLE_ORDER.map((name) => styles.get(name)).filter(
    (style): style is TypescaleStyle => style !== undefined,
  );
  if (ordered.length === 0) {
    throw new Error('No Material typescale styles were found in the provided typescale tokens file.');
  }

  return ordered;
}

/**
 * Reads a single typescale style.
 *
 * @param rawStyleName The style name from the tokens file.
 * @param styleTokens The style's token group.
 * @param typography The parsed typography.
 * @param options The variable font options.
 * @returns The style, or `undefined` when the group is not a complete typescale style.
 * @throws If the weight or emphasized weight name is unsupported.
 */
function parseTypescaleStyle(
  rawStyleName: string,
  styleTokens: unknown,
  typography: Typography,
  options: VariableFontOptions,
): TypescaleStyle | undefined {
  if (!styleTokens || typeof styleTokens !== 'object') {
    return undefined;
  }

  const group = styleTokens as Record<string, unknown>;
  const font = getTokenValue(group['Font']);
  const weightName = getTokenValue(group['Weight']);
  const size = getTokenValue(group['Size']);
  const lineHeight = getTokenValue(group['Line height']);
  const tracking = getTokenValue(group['Tracking']);

  if (
    typeof font !== 'string' ||
    typeof weightName !== 'string' ||
    !isFiniteNumber(size) ||
    !isFiniteNumber(lineHeight) ||
    !isFiniteNumber(tracking)
  ) {
    return undefined;
  }

  const weight = parseWeight(weightName, rawStyleName);
  if (weight === undefined) {
    throw new Error(`Unsupported typography weight name in typescale: ${weightName}`);
  }

  const style: TypescaleStyle = {
    name: toKebabCase(rawStyleName),
    font: shouldUseVariableFont(font, typography, options) ? toVariableFontName(font) : font.trim(),
    weight,
    size: toRem(size),
    lineHeight: toRem(lineHeight),
    tracking: toRem(tracking),
  };

  const prominentWeightName = getTokenValue(group['Weight-emphasized']);
  if (typeof prominentWeightName === 'string') {
    const prominentWeight = parseWeight(prominentWeightName, `${rawStyleName} Weight-emphasized`);
    if (prominentWeight === undefined) {
      throw new Error(`Unsupported typography emphasized weight name in typescale: ${prominentWeightName}`);
    }

    style.prominentWeight = prominentWeight;
  }

  return style;
}

/**
 * Checks whether a value is a finite number.
 *
 * @param value The value.
 * @returns `true` for finite numbers.
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Formats the `$typography` map entries.
 *
 * @param typography The parsed typography.
 * @returns The map entries.
 */
function typographyEntries(typography: Typography): string[] {
  return [
    `plain-family: ${toScssString(typography.plainFamily)},`,
    `brand-family: ${toScssString(typography.brandFamily)},`,
    ...Object.entries(typography.weights).map(([name, value]) => `${name}-weight: ${value},`),
  ];
}

/**
 * Formats the `$typography-overrides` map entries.
 *
 * @param styles The parsed typescale styles.
 * @returns The map entries.
 */
function typescaleEntries(styles: TypescaleStyle[]): string[] {
  return styles.flatMap((style) => {
    const font = toScssString(style.font);
    const entries = [
      `${style.name}: ${style.weight} ${style.size} #{'/'} ${style.lineHeight} ${font},`,
      `${style.name}-font: ${font},`,
      `${style.name}-line-height: ${style.lineHeight},`,
      `${style.name}-size: ${style.size},`,
      `${style.name}-tracking: ${style.tracking},`,
      `${style.name}-weight: ${style.weight},`,
    ];
    if (PROMINENT_WEIGHT_STYLES.includes(style.name) && style.prominentWeight !== undefined) {
      entries.push(`${style.name}-weight-prominent: ${style.prominentWeight},`);
    }

    return entries;
  });
}

/**
 * Formats an SCSS map.
 *
 * @param entries The map entries, without indentation.
 * @returns The SCSS map.
 */
function toScssMap(entries: string[]): string {
  return ['(', ...entries.map((entry) => `${SCSS_INDENT}${entry}`), ')'].join('\n');
}

/**
 * Builds the generated SCSS file.
 *
 * @param banner The generated-file banner.
 * @param input The font tokens path, as shown in the file.
 * @param typescale The typescale tokens path, as shown in the file.
 * @param typography The parsed typography.
 * @param styles The parsed typescale styles.
 * @returns The SCSS source.
 */
export function buildScss(
  banner: string,
  input: string,
  typescale: string,
  typography: Typography,
  styles: TypescaleStyle[],
): string {
  return [
    banner,
    '',
    `// Note: Typography tokens are generated from '${input}'`,
    `$typography: ${toScssMap(typographyEntries(typography))};`,
    '',
    `// Note: Typography overrides are generated from '${typescale}'`,
    `$typography-overrides: ${toScssMap(typescaleEntries(styles))};`,
    '',
  ].join('\n');
}
