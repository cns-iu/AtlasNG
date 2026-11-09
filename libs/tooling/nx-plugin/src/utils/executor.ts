import { logger } from '@nx/devkit';
import { mkdir, writeFile as fsWriteFile } from 'node:fs/promises';
import { basename, dirname, format, resolve } from 'node:path';

/** Result returned by executors. */
export interface ExecutorResult {
  /** Whether the executor finished without errors. */
  success: boolean;
}

/**
 * Runs an executor task, logging any error instead of throwing it.
 *
 * @param task The work to run.
 * @returns `{ success: true }` when the task resolves, otherwise `{ success: false }`.
 */
export async function runExecutorTask(task: () => Promise<void>): Promise<ExecutorResult> {
  try {
    await task();
    return { success: true };
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  }
}

/**
 * Resolves the absolute path of a generated file.
 * Without an explicit output the file is placed next to the input, replacing everything from
 * the first `.` of its name with `extension`, e.g. `shape.tokens.json` => `shape.shape.scss`.
 *
 * @param root The workspace root that relative paths are resolved against.
 * @param input Path to the input file.
 * @param output Optional explicit output path.
 * @param extension Extension of the default output file, e.g. `.shape.scss`.
 * @returns The absolute output path.
 */
export function resolveOutputPath(root: string, input: string, output: string | undefined, extension: string): string {
  if (output) {
    return resolve(root, output);
  }

  const inputPath = resolve(root, input);
  return format({
    dir: dirname(inputPath),
    name: basename(inputPath).replace(/\..*$/, ''),
    ext: extension,
  });
}

/**
 * Writes a generated file, creating its directory when needed.
 *
 * @param outputPath Absolute path of the file to write.
 * @param content The file contents.
 */
export async function writeFile(outputPath: string, content: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await fsWriteFile(outputPath, content, 'utf8');
}
