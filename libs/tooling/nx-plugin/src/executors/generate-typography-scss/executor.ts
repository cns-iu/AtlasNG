import { type ExecutorContext, logger } from '@nx/devkit';
import { relative, resolve } from 'node:path';
import { type ExecutorResult, resolveOutputPath, runExecutorTask, writeFile } from '../../utils/executor.ts';
import { formatOutputData, indent, type OutputData } from '../../utils/output.ts';
import {
  assertJsonObject,
  createScssBanner,
  getTokenValue,
  isJsonObject,
  normalizeKey,
  readTokensFile,
  type TokensObject,
} from '../../utils/tokens.ts';
import {
  PROMINENT_WEIGHT_STYLES,
  REM_DECIMALS,
  SCSS_IDENTIFIER_REGEX,
  TYPESCALE_STYLES,
  VARIABLE_FONT_SUFFIX,
  WEIGHT_BY_NAME,
} from './constants.ts';

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
    const typography = parseTypography(await readTokensFile(resolve(context.root, options.input)), options);
    const styles = parseTypescale(await readTokensFile(resolve(context.root, options.typescale)), typography, options);

    await writeFile(
      outputPath,
      buildScss(options.input, options.typescale, createScssBanner(context), typography, styles),
    );
    logger.info(`Wrote ${relative(context.root, outputPath)}`);
  });
}

/**
 * Resolves a weight name to its numeric font weight.
 *
 * @param value The weight name from the token value.
 * @param fallbackName Name used when `value` is empty.
 * @returns The numeric weight, or `undefined` for unknown names.
 */
export function parseWeight(value: unknown, fallbackName: string): number | undefined {
  return WEIGHT_BY_NAME[toWeightKey(String(value || fallbackName))];
}

/**
 * Normalizes a weight name to a kebab-case key, dropping `italic`,
 * e.g. `Semi_bold Italic` => `semi-bold`.
 *
 * @param name The weight name.
 * @returns The weight key.
 */
function toWeightKey(name: string): string {
  return normalizeKey(name.replace(/\bitalic\b/gi, '')).replace(/^-|-$/g, '');
}

/**
 * Formats a string as an SCSS value, quoting it unless it is a plain identifier.
 *
 * @param value The string.
 * @returns The SCSS identifier or quoted string.
 */
export function toScssString(value: string): string {
  if (SCSS_IDENTIFIER_REGEX.test(value)) {
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
  const staticTokens = isJsonObject(tokens['Static']) ? tokens['Static'] : {};
  const font = isJsonObject(staticTokens['Font']) ? staticTokens['Font'] : {};
  const plainFamily = getTokenValue(font['Plain']);
  const brandFamily = getTokenValue(font['Brand']);

  if (typeof plainFamily !== 'string' || plainFamily.trim().length === 0) {
    throw new Error('Missing required token: Static.Font.Plain.$value');
  }

  if (typeof brandFamily !== 'string' || brandFamily.trim().length === 0) {
    throw new Error('Missing required token: Static.Font.Brand.$value');
  }

  const weightGroup = staticTokens['Weight'];
  assertJsonObject(weightGroup, 'Missing required token group: Static.Weight');

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
 * @returns The styles, in {@link TYPESCALE_STYLES} order.
 * @throws If `Static` is missing, no Material style is found, or a weight name is unsupported.
 */
export function parseTypescale(
  tokens: TokensObject,
  typography: Typography,
  options: VariableFontOptions = {},
): TypescaleStyle[] {
  const staticTokens = tokens['Static'];
  assertJsonObject(staticTokens, 'Missing required token group: Static');

  const styles = new Map<string, TypescaleStyle>();
  for (const [rawStyleName, styleTokens] of Object.entries(staticTokens)) {
    const style = parseTypescaleStyle(rawStyleName, styleTokens, typography, options);
    if (style) {
      styles.set(style.name, style);
    }
  }

  if (styles.size === 0) {
    throw new Error('No valid typescale styles were found in the provided typescale tokens file.');
  }

  const ordered = TYPESCALE_STYLES.map((name) => styles.get(name)).filter(
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
  if (!isJsonObject(styleTokens)) {
    return undefined;
  }

  const font = getTokenValue(styleTokens['Font']);
  const weightName = getTokenValue(styleTokens['Weight']);
  const size = getTokenValue(styleTokens['Size']);
  const lineHeight = getTokenValue(styleTokens['Line height']);
  const tracking = getTokenValue(styleTokens['Tracking']);

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
    name: normalizeKey(rawStyleName),
    font: shouldUseVariableFont(font, typography, options) ? toVariableFontName(font) : font.trim(),
    weight,
    size: toRem(size),
    lineHeight: toRem(lineHeight),
    tracking: toRem(tracking),
  };

  const prominentWeightName = getTokenValue(styleTokens['Weight-emphasized']);
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
function typographyEntries(typography: Typography): OutputData {
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
function typescaleEntries(styles: TypescaleStyle[]): OutputData {
  return styles.map((style) => {
    const font = toScssString(style.font);
    return [
      `${style.name}: ${style.weight} ${style.size} #{'/'} ${style.lineHeight} ${font},`,
      `${style.name}-font: ${font},`,
      `${style.name}-line-height: ${style.lineHeight},`,
      `${style.name}-size: ${style.size},`,
      `${style.name}-tracking: ${style.tracking},`,
      `${style.name}-weight: ${style.weight},`,
      PROMINENT_WEIGHT_STYLES.includes(style.name) && style.prominentWeight !== undefined
        ? `${style.name}-weight-prominent: ${style.prominentWeight},`
        : [],
    ];
  });
}

/**
 * Builds the generated SCSS file.
 *
 * @param inputPath The font tokens path, as shown in the file.
 * @param typescalePath The typescale tokens path, as shown in the file.
 * @param banner The generated-file banner.
 * @param typography The parsed typography.
 * @param styles The parsed typescale styles.
 * @returns The SCSS source.
 */
export function buildScss(
  inputPath: string,
  typescalePath: string,
  banner: OutputData,
  typography: Typography,
  styles: TypescaleStyle[],
): string {
  return formatOutputData([
    banner,
    '',
    `// Note: Typography tokens are generated from '${inputPath}'`,
    '$typography: (',
    indent(typographyEntries(typography)),
    ');',
    '',
    `// Note: Typography overrides are generated from '${typescalePath}'`,
    '$typography-overrides: (',
    indent(typescaleEntries(styles)),
    ');',
    '',
  ]);
}
