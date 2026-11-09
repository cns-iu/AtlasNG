import { type ExecutorContext, logger } from '@nx/devkit';
import { relative, resolve } from 'node:path';
import { type ExecutorResult, resolveOutputPath, runExecutorTask, writeFile } from '../../utils/executor.ts';
import { formatOutputData, indent, type OutputData } from '../../utils/output.ts';
import {
  assertJsonObject,
  createScssBanner,
  findKey,
  getHex,
  isJsonObject,
  normalizeKey,
  readTokensFile,
  type TokensObject,
} from '../../utils/tokens.ts';
import {
  EXT_TONES,
  EXT_VARIANT_TONES,
  HEX_COLOR_REGEX,
  PALETTE_TONE_KEY_REGEX,
  PALETTES,
  type PaletteName,
  SCSS_EXPORTS,
  TONE_REGEX,
  TONES_BY_PALETTE,
} from './constants.ts';

/** Options for the `generate-palettes-scss` executor. */
export interface GeneratePalettesScssExecutorOptions {
  /** Path to the palette tokens JSON file, relative to the workspace root. */
  input: string;
  /** Path to the output SCSS file, relative to the workspace root. Defaults to `<input name>.palettes.scss` next to the input. */
  output?: string;
}

/** Hex colors keyed by tone. A tone maps to `undefined` when its token has no hex value. */
export type Tones = Record<number, string | undefined>;

/** Material core palette tones keyed by palette name. */
export type CorePalettes = Partial<Record<PaletteName, Tones>>;

/** An extension palette with its optional `variant` sub-palette. */
export interface ExtPalette {
  /** Every numeric tone of the palette. */
  tones: Tones;
  /** Every numeric tone of the `variant` sub-palette, or `null` when there is none. */
  variant: Tones | null;
}

/** Extension palettes keyed by normalized name. */
export type ExtPalettes = Record<string, ExtPalette>;

/** A palette to validate together with the tones it must provide. */
export interface ValidationSpec {
  /** Palette label used in error messages, e.g. `primary` or `ext success variant`. */
  label: string;
  /** The palette tones. */
  palette: Tones;
  /** The tones the palette must provide. */
  tones: readonly number[];
  /** Whether every collected tone is validated as a hex color, not just the required ones. */
  validateAllTones: boolean;
}

/**
 * Generates Material core and extension palette SCSS maps from a Figma palette tokens export.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether the file was generated.
 */
export default async function generatePalettesScssExecutor(
  options: GeneratePalettesScssExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorResult> {
  return runExecutorTask(async () => {
    const outputPath = resolveOutputPath(context.root, options.input, options.output, '.palettes.scss');
    const palettes = readPalettes(await readTokensFile(resolve(context.root, options.input)));
    const core = parseCorePalettes(palettes);
    const ext = parseExtPalettes(palettes);

    validatePalettes(buildValidationSpecs(core, ext));

    await writeFile(outputPath, buildScss(options.input, createScssBanner(context), core, ext));
    logger.info(`Wrote ${relative(context.root, outputPath)}`);
  });
}

/**
 * Reads the palettes group of a tokens object.
 *
 * @param tokens The parsed tokens file.
 * @returns The palettes object (matched case-insensitively).
 * @throws If the tokens have no palettes object.
 */
export function readPalettes(tokens: TokensObject): TokensObject {
  const palettes = findKey(tokens, 'palettes');
  assertJsonObject(palettes, 'Input file must contain a "palettes" object (case-insensitive).');

  return palettes;
}

/**
 * Flattens palette tokens into `[name, token]` entries keyed as `<Palette> <tone>`.
 * Supports both flat exports (`Palettes["Primary 40"]`) and nested exports (`Palettes.Primary["40"]`).
 *
 * @param palettes The palettes object from the tokens file.
 * @returns Flattened palette token entries.
 */
function flattenPaletteEntries(palettes: TokensObject): [string, unknown][] {
  const entries: [string, unknown][] = [];

  for (const [key, value] of Object.entries(palettes)) {
    // A token has a `$value`; any other object is a group of tokens keyed by tone.
    if (!isJsonObject(value) || '$value' in value) {
      entries.push([key, value]);
      continue;
    }

    for (const [tone, token] of Object.entries(value)) {
      entries.push([`${key} ${tone}`, token]);
    }
  }

  return entries;
}

/**
 * Parses the Material core palettes, matching palette names case-insensitively.
 *
 * @param palettes The palettes object from the tokens file.
 * @returns Hex colors keyed by palette and tone.
 */
export function parseCorePalettes(palettes: TokensObject): CorePalettes {
  const result: CorePalettes = {};

  for (const [key, value] of flattenPaletteEntries(palettes)) {
    const match = PALETTE_TONE_KEY_REGEX.exec(key);
    if (!match) {
      continue;
    }

    const paletteKey = normalizeKey(match[1]) as PaletteName;
    if (!PALETTES.includes(paletteKey)) {
      continue;
    }

    const tone = parseInt(match[2], 10);
    result[paletteKey] ??= {};
    result[paletteKey][tone] = getHex(value);
  }

  return result;
}

/**
 * Collects every numeric tone in a palette group, sorted by tone.
 *
 * @param group A palette group keyed by tone.
 * @returns Hex colors keyed by tone.
 */
function collectTones(group: TokensObject): Tones {
  const tones = Object.keys(group)
    .filter((key) => TONE_REGEX.test(key.trim()))
    .map((key): [number, string | undefined] => [parseInt(key, 10), getHex(group[key])])
    .sort(([a], [b]) => a - b);

  return Object.fromEntries(tones);
}

/**
 * Parses the extension palettes under `palettes.ext`. Every group under `ext` is
 * treated as a palette, named by its normalized key.
 *
 * @param palettes The palettes object from the tokens file.
 * @returns Extension palettes keyed by name, or `null` when the file has no `ext` group or it is empty.
 */
export function parseExtPalettes(palettes: TokensObject): ExtPalettes | null {
  const ext = findKey(palettes, 'ext');
  if (!isJsonObject(ext)) {
    return null;
  }

  const result: ExtPalettes = {};

  for (const [key, group] of Object.entries(ext)) {
    // Skip token metadata such as `$type` and anything that is not a palette group.
    if (key.startsWith('$') || !isJsonObject(group)) {
      continue;
    }

    const variant = findKey(group, 'variant');
    result[normalizeKey(key)] = {
      tones: collectTones(group),
      variant: isJsonObject(variant) ? collectTones(variant) : null,
    };
  }

  const names = Object.keys(result).sort((a, b) => a.localeCompare(b));
  if (names.length === 0) {
    return null;
  }

  return Object.fromEntries(names.map((name) => [name, result[name]]));
}

/**
 * Builds the list of palettes to validate, with the tones each one must provide.
 *
 * @param core The parsed core palettes.
 * @param ext The parsed extension palettes.
 * @returns Validation specs.
 */
export function buildValidationSpecs(core: CorePalettes, ext: ExtPalettes | null): ValidationSpec[] {
  const specs: ValidationSpec[] = PALETTES.map((key) => ({
    label: key,
    palette: core[key] ?? {},
    tones: TONES_BY_PALETTE[key],
    // Core palettes only emit their required tones.
    validateAllTones: false,
  }));

  for (const [name, { tones, variant }] of Object.entries(ext ?? {})) {
    specs.push({ label: `ext ${name}`, palette: tones, tones: EXT_TONES, validateAllTones: true });
    if (variant) {
      specs.push({ label: `ext ${name} variant`, palette: variant, tones: EXT_VARIANT_TONES, validateAllTones: true });
    }
  }

  return specs;
}

/**
 * Validates that every palette provides its required tones and that every
 * collected tone is a valid hex color.
 *
 * @param specs The palettes to validate.
 * @throws If tones are missing or invalid.
 */
export function validatePalettes(specs: ValidationSpec[]): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  for (const { label, palette, tones, validateAllTones } of specs) {
    for (const tone of tones) {
      if (!(tone in palette)) {
        missing.push(`${label} ${tone}`);
      }
    }

    const checked = validateAllTones ? Object.keys(palette).map(Number) : tones;
    for (const tone of checked) {
      if (tone in palette && !HEX_COLOR_REGEX.test(palette[tone] ?? '')) {
        invalid.push(`${label} ${tone}`);
      }
    }
  }

  const errors: string[] = [];
  if (missing.length > 0) {
    errors.push(`Missing palette entries (${missing.length}): ${missing.join(', ')}`);
  }
  if (invalid.length > 0) {
    errors.push(`Invalid hex color entries (${invalid.length}): ${invalid.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

/**
 * Converts the validated core palettes into Sass map entries with each palette's required tones.
 *
 * @param palettes The parsed core palettes.
 * @returns The Sass map entries.
 */
function corePalettesToScssEntries(palettes: CorePalettes): OutputData {
  return PALETTES.map((key) => {
    const palette = palettes[key] ?? {};
    return [`${key}: (`, indent(TONES_BY_PALETTE[key].map((tone) => `${tone}: ${palette[tone]},`)), '),'];
  });
}

/**
 * Converts the extension palettes into Sass map entries, nesting each palette's
 * optional `variant` sub-palette.
 *
 * @param ext The parsed extension palettes.
 * @returns The Sass map entries.
 */
function extPalettesToScssEntries(ext: ExtPalettes): OutputData {
  const toneEntries = (tones: Tones): OutputData => Object.entries(tones).map(([tone, hex]) => `${tone}: ${hex},`);

  return Object.entries(ext).map(([name, { tones, variant }]) => [
    `${name}: (`,
    indent([toneEntries(tones), variant ? ['variant: (', indent(toneEntries(variant)), '),'] : []]),
    '),',
  ]);
}

/**
 * Builds the generated palettes SCSS file.
 *
 * @param inputPath The input path, as shown in the file.
 * @param banner The generated-file banner.
 * @param core The parsed core palettes.
 * @param ext The parsed extension palettes, or `null`.
 * @returns The SCSS source.
 */
export function buildScss(inputPath: string, banner: OutputData, core: CorePalettes, ext: ExtPalettes | null): string {
  return formatOutputData([
    banner,
    '',
    `@use 'sass:map';`,
    '',
    `// Note: Color palettes are generated from '${inputPath}'`,
    '$_palettes: (',
    indent(corePalettesToScssEntries(core)),
    ');',
    '',
    SCSS_EXPORTS,
    ext ? ['$ext-palettes: (', indent(extPalettesToScssEntries(ext)), ');', ''] : [],
  ]);
}
