import { type ExecutorContext, logger, type ProjectGraph, type ProjectGraphProjectNode } from '@nx/devkit';
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
  /** The built package directory that is published, relative to the workspace root. */
  packageRoot: string;
}

/** Name of the target that `nx release publish` runs for each project. */
const PUBLISH_TARGET = 'nx-release-publish';

/**
 * Builds and publishes release projects that do not exist on npm yet and configures npm trusted publishing for them,
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
    const dryRun = options.dryRun ?? false;
    const missing = (await getReleasePackages(context)).filter(({ packageName }) => !isPublished(packageName));
    if (missing.length === 0) {
      logger.info('All release packages already exist on npm.');
      return { success: true };
    }

    exec('npx', ['nx', 'run-many', '-t', 'build', `--projects=${missing.map(({ project }) => project).join(',')}`], {
      dryRun,
      cwd: context.root,
    });
    for (const pkg of missing) {
      logger.info(`Bootstrapping ${pkg.packageName} (${pkg.project})`);
      bootstrap(pkg, { repository, workflow, dryRun, cwd: context.root });
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
 * @returns The release projects, their package names and publish directories, with every package listed after the
 * workspace packages it depends on and ties sorted by project name.
 */
export async function getReleasePackages(context: ExecutorContext): Promise<ReleasePackage[]> {
  const packages: ReleasePackage[] = [];
  const projects = Object.values(context.projectGraph.nodes)
    .filter(({ data }) => data.root !== '.' && data.targets?.[PUBLISH_TARGET])
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const { name, data } of sortByDependencies(projects, context.projectGraph)) {
    const manifest = JSON.parse(await readFile(join(context.root, data.root, 'package.json'), 'utf8')) as {
      name: string;
    };
    const packageRoot = (data.targets?.[PUBLISH_TARGET]?.options as { packageRoot?: string } | undefined)?.packageRoot;
    packages.push({
      project: name,
      packageName: manifest.name,
      packageRoot: packageRoot
        ? packageRoot.replace('{workspaceRoot}/', '').replace('{projectRoot}', data.root)
        : data.root,
    });
  }

  return packages;
}

/**
 * Orders projects so that each one comes after the projects it depends on, which npm needs to resolve the
 * dependencies of a newly published package.
 *
 * @param projects The projects to order; their order breaks ties.
 * @param graph The Nx project graph.
 * @returns The projects in dependency order.
 */
function sortByDependencies(projects: ProjectGraphProjectNode[], graph: ProjectGraph): ProjectGraphProjectNode[] {
  const included = new Map(projects.map((project) => [project.name, project]));
  const sorted: ProjectGraphProjectNode[] = [];
  const visited = new Set<string>();
  const visit = (project: ProjectGraphProjectNode): void => {
    if (visited.has(project.name)) {
      return;
    }
    visited.add(project.name);
    for (const { target } of graph.dependencies[project.name] ?? []) {
      const dependency = included.get(target);
      if (dependency) {
        visit(dependency);
      }
    }
    sorted.push(project);
  };
  projects.forEach(visit);

  return sorted;
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
 * Publishes a built package for the first time and configures npm trusted publishing for the publish workflow.
 *
 * The package is published with `npm publish` instead of the `nx-release-publish` target: that target also publishes
 * every dependency and runs npm without a terminal, so npm cannot wait for browser-based two-factor authentication.
 *
 * @param pkg The release project, its package name and its built package directory.
 * @param settings The resolved repository, workflow, dry-run flag and working directory.
 * @param settings.repository The GitHub repository in `owner/name` form.
 * @param settings.workflow The workflow file name.
 * @param settings.dryRun Whether to only print the commands.
 * @param settings.cwd The workspace root.
 */
function bootstrap(
  { packageName, packageRoot }: ReleasePackage,
  settings: { repository: string; workflow: string; dryRun: boolean; cwd: string },
): void {
  exec('npm', ['publish', packageRoot, '--access=public'], settings);
  exec(
    'npm',
    [
      'trust',
      'github',
      packageName,
      `--file=${settings.workflow}`,
      `--repo=${settings.repository}`,
      '--allow-publish',
      '--yes',
    ],
    settings,
  );
}

/**
 * Runs a command attached to the terminal, so that npm can prompt for authentication, or only prints it in dry-run
 * mode.
 *
 * @param command The executable to run.
 * @param args The command arguments.
 * @param settings The dry-run flag and working directory.
 * @param settings.dryRun Whether to only print the command.
 * @param settings.cwd The working directory.
 */
function exec(command: string, args: string[], { dryRun, cwd }: { dryRun: boolean; cwd: string }): void {
  if (dryRun) {
    logger.info(`[dry-run] ${command} ${args.join(' ')}`);
    return;
  }

  execFileSync(command, args, { stdio: 'inherit', cwd });
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
