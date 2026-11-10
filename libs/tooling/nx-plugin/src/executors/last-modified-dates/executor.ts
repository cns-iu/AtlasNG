import { type ExecutorContext, logger } from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import { parse, resolve } from 'node:path';
import { type ExecutorResult, runExecutorTask, writeFile } from '../../utils/executor.ts';

/** A page and the source file or files it is generated from. */
export interface LastModifiedPage {
  /**
   * Route of the page, for example `/about`. A route with one `:param` segment, for example
   * `/dataset/:datasetId`, creates one route per source file, named after the file without its extension.
   */
  route: string;
  /**
   * Source file or glob relative to the workspace root. Only files tracked by Git are used.
   * When a route without a `:param` matches several files, it gets the latest date.
   */
  source: string;
}

/** Options for the `last-modified-dates` executor. */
export interface LastModifiedDatesExecutorOptions {
  /** Pages to date. */
  pages: LastModifiedPage[];
  /** JSON file to write, relative to the workspace root. */
  outputFile: string;
}

/** Map of page routes to commit timestamps in milliseconds since the Unix epoch. */
export type RouteTimestamps = Record<string, number>;

/** Matches a `:param` route segment. */
const ROUTE_PARAM_PATTERN = /:[^/]+/g;

/**
 * Writes a JSON file that maps page routes to the timestamp of the last Git commit that changed each page's
 * source file. Layout, style, and component changes don't affect the dates.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether the file was written.
 */
export default async function lastModifiedDatesExecutor(
  options: LastModifiedDatesExecutorOptions,
  context: ExecutorContext,
): Promise<ExecutorResult> {
  return runExecutorTask(async () => {
    const dates = collectLastModifiedDates(options.pages, context.root);
    await writeFile(resolve(context.root, options.outputFile), `${JSON.stringify(dates, null, 2)}\n`);
    logger.info(`Wrote last modified dates for ${Object.keys(dates).length} pages to ${options.outputFile}`);
  });
}

/**
 * Looks up the last modified date of every configured page.
 *
 * @param pages The pages to date.
 * @param root The workspace root, which must be inside a Git repository.
 * @returns The commit timestamps keyed by route, sorted by route.
 * @throws When a route has more than one `:param` segment, or a `:param` route's source isn't a glob.
 */
export function collectLastModifiedDates(pages: LastModifiedPage[], root: string): RouteTimestamps {
  if (git(root, ['rev-parse', '--is-shallow-repository']) === 'true') {
    logger.warn(
      'The Git repository is a shallow clone, so last modified dates may be wrong. ' +
        'Fetch the full history, for example with `fetch-depth: 0` in `actions/checkout`.',
    );
  }

  const dates: RouteTimestamps = {};
  for (const { route, source } of pages) {
    const files = listTrackedFiles(root, source);
    if (files.length === 0) {
      logger.warn(`No files tracked by Git match ${source} for route ${route}.`);
    }

    for (const [pageRoute, date] of datePages(root, route, source, files)) {
      if (pageRoute in dates) {
        logger.warn(`Route ${pageRoute} is configured more than once; using its latest date.`);
      }
      dates[pageRoute] = Math.max(dates[pageRoute] ?? date, date);
    }
  }

  return Object.fromEntries(Object.entries(dates).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Dates the routes of one page configuration.
 *
 * @param root The workspace root.
 * @param route The configured route, possibly with a `:param` segment.
 * @param source The configured source, used in error messages.
 * @param files The tracked files matching the source.
 * @returns Route and timestamp pairs. Files without a commit are left out.
 * @throws When the route has more than one `:param` segment, or has one and the source isn't a glob.
 */
function datePages(root: string, route: string, source: string, files: string[]): [string, number][] {
  const params = route.match(ROUTE_PARAM_PATTERN) ?? [];
  if (params.length > 1) {
    throw new Error(`Route ${route} has more than one :param segment; only one is supported.`);
  }
  if (params.length === 1 && !/[*?[]/.test(source)) {
    throw new Error(`Route ${route} has a :param segment, so its source must be a glob, but got ${source}.`);
  }

  const pairs: [string, number][] = [];
  for (const file of files) {
    const date = lastCommitTimestamp(root, file);
    if (date === undefined) {
      logger.warn(`${file} has no commits yet; it is left out.`);
      continue;
    }
    const pageRoute = params.length === 1 ? route.replace(params[0], parse(file).name) : route;
    pairs.push([normalizeRoute(pageRoute), date]);
  }

  if (params.length === 0 && pairs.length > 1) {
    return [[pairs[0][0], Math.max(...pairs.map(([, date]) => date))]];
  }
  return pairs;
}

/**
 * Lists the files tracked by Git that match a path or glob.
 *
 * @param root The workspace root.
 * @param source A path or glob relative to the workspace root.
 * @returns The matching file paths relative to the workspace root.
 */
function listTrackedFiles(root: string, source: string): string[] {
  return git(root, ['ls-files', '-z', '--', `:(glob)${source}`])
    .split('\0')
    .filter(Boolean);
}

/**
 * Reads the committer timestamp of the last commit that changed a file.
 *
 * @param root The workspace root.
 * @param file A file path relative to the workspace root.
 * @returns The timestamp in milliseconds since the Unix epoch, or `undefined` when the file has no commits.
 */
function lastCommitTimestamp(root: string, file: string): number | undefined {
  const seconds = git(root, ['log', '-1', '--format=%ct', '--', file]);
  return seconds ? Number(seconds) * 1000 : undefined;
}

/**
 * Runs a Git command in the workspace root.
 *
 * @param root The workspace root.
 * @param args The Git arguments.
 * @returns The trimmed standard output.
 */
function git(root: string, args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * Normalizes a route to start with a slash and have no trailing slash.
 *
 * @param route The route to normalize.
 * @returns The normalized route, for example `/about`.
 */
function normalizeRoute(route: string): string {
  const trimmed = route.replace(/^\/+|\/+$/g, '');
  return `/${trimmed}`;
}
