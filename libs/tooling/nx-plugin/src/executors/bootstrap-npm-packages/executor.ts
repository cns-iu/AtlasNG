import { type ExecutorContext, logger } from '@nx/devkit';
import { execFileSync, type ExecFileSyncOptions } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Options for the `bootstrap-npm-packages` executor. */
export interface BootstrapNpmPackagesExecutorOptions {
  /** GitHub repository (`owner/name`) allowed to publish. Defaults to the `origin` git remote. */
  repository?: string;
  /** Workflow file name that publishes the packages. Defaults to `publish.yml`. */
  workflow?: string;
  /** Only print the commands that would run. */
  dryRun?: boolean;
}

/** A release project and the npm package it publishes. */
export interface ReleasePackage {
  /** The Nx project name. */
  project: string;
  /** The npm package name from the project's `package.json`. */
  packageName: string;
}

/** Name of the target that `nx release publish` runs for each project. */
const PUBLISH_TARGET = 'nx-release-publish';

/**
 * Publishes release projects that do not exist on npm yet and configures npm trusted publishing for them,
 * so that later releases can be published from CI.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether every package was bootstrapped.
 */
export default async function bootstrapNpmPackagesExecutor(
  options: BootstrapNpmPackagesExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  try {
    const repository = options.repository ?? getGitHubRepository(context.root);
    const workflow = options.workflow ?? 'publish.yml';
    const missing = (await getReleasePackages(context)).filter(({ packageName }) => !isPublished(packageName));
    if (missing.length === 0) {
      logger.info('All release packages already exist on npm.');
      return { success: true };
    }

    for (const pkg of missing) {
      logger.info(`Bootstrapping ${pkg.packageName} (${pkg.project})`);
      bootstrap(pkg, { repository, workflow, dryRun: options.dryRun ?? false, cwd: context.root });
    }

    return { success: true };
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  }
}

/**
 * Lists the npm packages released by `nx release`, skipping the workspace root project.
 *
 * @param context The Nx executor context.
 * @returns The release projects and their package names, sorted by project name.
 */
export async function getReleasePackages(context: ExecutorContext): Promise<ReleasePackage[]> {
  const packages: ReleasePackage[] = [];
  const projects = Object.values(context.projectGraph.nodes)
    .filter(({ data }) => data.root !== '.' && data.targets?.[PUBLISH_TARGET])
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const { name, data } of projects) {
    const manifest = JSON.parse(await readFile(join(context.root, data.root, 'package.json'), 'utf8')) as {
      name: string;
    };
    packages.push({ project: name, packageName: manifest.name });
  }

  return packages;
}

/**
 * Reads the GitHub `owner/name` of the `origin` remote.
 *
 * @param cwd The workspace root.
 * @returns The repository in `owner/name` form.
 * @throws When the remote is missing or does not point to GitHub.
 */
export function getGitHubRepository(cwd: string): string {
  const url = run('git', ['remote', 'get-url', 'origin'], { cwd });
  const match = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/.exec(url);
  if (!match?.[1]) {
    throw new Error(`Unable to determine the GitHub repository from the origin remote "${url}". Pass --repository.`);
  }

  return match[1];
}

/**
 * Checks whether a package already exists on the npm registry.
 *
 * @param packageName The npm package name.
 * @returns Whether the package has been published before.
 */
function isPublished(packageName: string): boolean {
  try {
    run('npm', ['view', packageName, 'name'], { stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Publishes a package for the first time and configures npm trusted publishing for the publish workflow.
 *
 * @param pkg The release project and its package name.
 * @param settings The resolved repository, workflow, dry-run flag and working directory.
 * @param settings.repository The GitHub repository in `owner/name` form.
 * @param settings.workflow The workflow file name.
 * @param settings.dryRun Whether to only print the commands.
 * @param settings.cwd The workspace root.
 */
function bootstrap(
  { project, packageName }: ReleasePackage,
  settings: { repository: string; workflow: string; dryRun: boolean; cwd: string },
): void {
  const publishArgs = ['nx', 'run', `${project}:${PUBLISH_TARGET}`, '--access=public', '--firstRelease'];
  const trustArgs = [
    'trust',
    'github',
    packageName,
    `--file=${settings.workflow}`,
    `--repo=${settings.repository}`,
    '--allow-publish',
    '--yes',
  ];

  if (settings.dryRun) {
    logger.info(`[dry-run] npx ${publishArgs.join(' ')}`);
    logger.info(`[dry-run] npm ${trustArgs.join(' ')}`);
    return;
  }

  execFileSync('npx', publishArgs, { stdio: 'inherit', cwd: settings.cwd });
  execFileSync('npm', trustArgs, { stdio: 'inherit', cwd: settings.cwd });
}

/**
 * Runs a command and returns its trimmed stdout.
 *
 * @param command The executable to run.
 * @param args The command arguments.
 * @param options Additional exec options.
 * @returns The trimmed stdout of the command.
 */
function run(command: string, args: string[], options: ExecFileSyncOptions = {}): string {
  return String(execFileSync(command, args, { encoding: 'utf8', ...options }) ?? '').trim();
}
