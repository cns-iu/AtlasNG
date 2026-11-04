import { type ExecutorContext, logger } from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, parse, resolve } from 'node:path';

/** A page and the source file or files it is generated from. */
export interface PageLastModifiedSource {
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

/** Options for the `page-last-modified` executor. */
export interface PageLastModifiedExecutorOptions {
  /** Pages to date. */
  pages: PageLastModifiedSource[];
  /** JSON file to write, relative to the workspace root. */
  outputFile: string;
}

/** Map of page routes to `YYYY-MM-DD` dates. */
export type PageLastModifiedDates = Record<string, string>;

/** Matches a `:param` route segment. */
const ROUTE_PARAM_PATTERN = /:[^/]+/g;

/**
 * Writes a JSON file that maps page routes to the date of the last Git commit that changed each page's
 * source file. Layout, style, and component changes don't affect the dates.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether the file was written.
 */
export default async function pageLastModifiedExecutor(
  options: PageLastModifiedExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  try {
    const dates = collectPageLastModifiedDates(options.pages, context.root);
    const outputPath = resolve(context.root, options.outputFile);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(dates, null, 2)}\n`, 'utf8');
    logger.info(`Wrote last modified dates for ${Object.keys(dates).length} pages to ${options.outputFile}`);
    return { success: true };
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  }
}

/**
 * Looks up the last modified date of every configured page.
 *
 * @param pages The pages to date.
 * @param root The workspace root, which must be inside a Git repository.
 * @returns The dates keyed by route, sorted by route.
 * @throws When a route has more than one `:param` segment, or a `:param` route's source isn't a glob.
 */
export function collectPageLastModifiedDates(pages: PageLastModifiedSource[], root: string): PageLastModifiedDates {
  if (git(root, ['rev-parse', '--is-shallow-repository']) === 'true') {
    logger.warn(
      'The Git repository is a shallow clone, so last modified dates may be wrong. ' +
        'Fetch the full history, for example with `fetch-depth: 0` in `actions/checkout`.',
    );
  }

  const dates: PageLastModifiedDates = {};
  for (const { route, source } of pages) {
    const files = listTrackedFiles(root, source);
    if (files.length === 0) {
      logger.warn(`No files tracked by Git match ${source} for route ${route}.`);
    }

    for (const [pageRoute, date] of datePages(root, route, source, files)) {
      if (pageRoute in dates) {
        logger.warn(`Route ${pageRoute} is configured more than once; using its latest date.`);
      }
      dates[pageRoute] = latest(dates[pageRoute], date);
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
 * @returns Route and date pairs. Files without a commit are left out.
 * @throws When the route has more than one `:param` segment, or has one and the source isn't a glob.
 */
function datePages(root: string, route: string, source: string, files: string[]): [string, string][] {
  const params = route.match(ROUTE_PARAM_PATTERN) ?? [];
  if (params.length > 1) {
    throw new Error(`Route ${route} has more than one :param segment; only one is supported.`);
  }
  if (params.length === 1 && !/[*?[]/.test(source)) {
    throw new Error(`Route ${route} has a :param segment, so its source must be a glob, but got ${source}.`);
  }

  const pairs: [string, string][] = [];
  for (const file of files) {
    const date = lastCommitDate(root, file);
    if (!date) {
      logger.warn(`${file} has no commits yet; it is left out.`);
      continue;
    }
    const pageRoute = params.length === 1 ? route.replace(params[0], parse(file).name) : route;
    pairs.push([normalizeRoute(pageRoute), date]);
  }

  if (params.length === 0 && pairs.length > 1) {
    return [[pairs[0][0], pairs.map(([, date]) => date).reduce(latest)]];
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
 * Reads the committer date of the last commit that changed a file.
 *
 * @param root The workspace root.
 * @param file A file path relative to the workspace root.
 * @returns The date as `YYYY-MM-DD`, or an empty string when the file has no commits.
 */
function lastCommitDate(root: string, file: string): string {
  return git(root, ['log', '-1', '--format=%cs', '--', file]);
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

/**
 * Picks the later of two `YYYY-MM-DD` dates.
 *
 * @param a The first date, if any.
 * @param b The second date.
 * @returns The later date.
 */
function latest(a: string | undefined, b: string): string {
  return a !== undefined && a > b ? a : b;
}
