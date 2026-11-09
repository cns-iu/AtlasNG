import { type ExecutorContext, logger } from '@nx/devkit';
import { relative, resolve } from 'node:path';
import { type ExecutorResult, resolveOutputPath, runExecutorTask, writeFile } from '../../utils/executor.ts';
import { formatOutputData, indent, type OutputData } from '../../utils/output.ts';
import {
  assertJsonObject,
  createScssBanner,
  getNumberToken,
  readTokensFile,
  type TokensObject,
} from '../../utils/tokens.ts';

/** Options for the `generate-shape-scss` executor. */
export interface GenerateShapeScssExecutorOptions {
  /** Path to the shape tokens JSON file, relative to the workspace root. */
  input: string;
  /** Path to the output SCSS file, relative to the workspace root. Defaults to `<input name>.shape.scss` next to the input. */
  output?: string;
}

/** Corner radius values keyed by shape token name. */
export type Shapes = Partial<Record<(typeof SHAPE_KEYS)[number], number>>;

/** Supported `Corner` token keys, in output order. */
export const SHAPE_KEYS = [
  'extra-large',
  'extra-large-top',
  'extra-small',
  'extra-small-top',
  'full',
  'large',
  'large-end',
  'large-start',
  'large-top',
  'medium',
  'none',
  'small',
] as const;

/**
 * Generates a `$shape-overrides` SCSS map from a Figma shape tokens export.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether the file was generated.
 */
export default async function generateShapeScssExecutor(
  options: GenerateShapeScssExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorResult> {
  return runExecutorTask(async () => {
    const outputPath = resolveOutputPath(context.root, options.input, options.output, '.shape.scss');
    const tokens = await readTokensFile(resolve(context.root, options.input));
    const scss = buildScss(options.input, createScssBanner(context), parseShapes(tokens));

    await writeFile(outputPath, scss);
    logger.info(`Wrote ${relative(context.root, outputPath)}`);
  });
}

/**
 * Reads the supported corner radii from a tokens object.
 *
 * @param tokens The parsed tokens file.
 * @returns The corner radius for every supported key present in `Corner`.
 * @throws If `Corner` is missing or a supported key has no numeric `$value`.
 */
export function parseShapes(tokens: TokensObject): Shapes {
  const corner = tokens['Corner'];
  assertJsonObject(corner, 'Input file must contain a "Corner" object.');

  const shapes: Shapes = {};
  for (const key of SHAPE_KEYS) {
    if (key in corner) {
      shapes[key] = getNumberToken(corner, key, 'Corner');
    }
  }

  return shapes;
}

/**
 * Formats a pixel value, writing zero without a unit.
 *
 * @param value The value in pixels.
 * @returns The SCSS length.
 */
function toPx(value: number): string {
  return value === 0 ? '0' : `${value}px`;
}

/**
 * Formats a corner radius, rounding only the corners named by the key's `-top`/`-start`/`-end` suffix.
 *
 * @param key The shape key.
 * @param value The radius in pixels.
 * @returns The SCSS `border-radius` value.
 */
export function toCornerValue(key: string, value: number): string {
  const px = toPx(value);
  if (key.endsWith('-top')) {
    return `${px} ${px} 0 0`;
  } else if (key.endsWith('-bottom')) {
    return `0 0 ${px} ${px}`;
  } else if (key.endsWith('-start')) {
    return `${px} 0 0 ${px}`;
  } else if (key.endsWith('-end')) {
    return `0 ${px} ${px} 0`;
  }

  return px;
}

/**
 * Builds the generated SCSS file.
 *
 * @param inputPath The input path, as shown in the file.
 * @param banner The generated-file banner.
 * @param shapes The parsed shapes.
 * @returns The SCSS source.
 */
export function buildScss(inputPath: string, banner: OutputData, shapes: Shapes): string {
  const entries = SHAPE_KEYS.filter((key) => key in shapes).map(
    (key) => `corner-${key}: ${toCornerValue(key, shapes[key] as number)},`,
  );

  return formatOutputData([
    banner,
    '',
    `// Note: Shape overrides are generated from '${inputPath}'`,
    '$shape-overrides: (',
    indent(entries),
    ');',
    '',
  ]);
}
