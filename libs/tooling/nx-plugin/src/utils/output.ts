/** Lines of generated output, nested arbitrarily deep so that sections can be composed. */
export type OutputData = (string | number | boolean | OutputData)[];

/**
 * Depth passed to `Array.prototype.flat` to flatten {@link OutputData} completely.
 * Typed as `1` because the recursive `FlatArray` type for `Infinity` exceeds TypeScript's instantiation depth.
 */
const FLATTEN_DEPTH = Infinity as 1;

/**
 * Indents every line of the output.
 *
 * @param data The lines to indent.
 * @param level The number of two-space indentation levels.
 * @returns The flattened, indented lines.
 */
export function indent(data: OutputData, level = 1): OutputData {
  const indentation = '  '.repeat(level);
  return data.flat(FLATTEN_DEPTH).map((line) => `${indentation}${line}`);
}

/**
 * Flattens the output and joins its lines.
 *
 * @param data The lines to format.
 * @param separator The string placed between lines.
 * @returns The formatted output.
 */
export function formatOutputData(data: OutputData, separator = '\n'): string {
  return data.flat(FLATTEN_DEPTH).join(separator);
}
