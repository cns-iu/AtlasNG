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
 * The packages are published with `npm publish` instead of the `nx-release-publish` target: that target also publishes
 * every dependency and runs npm without a terminal, so npm cannot wait for browser-based two-factor authentication.
 * A failed publish stops the run, because later packages may depend on it. A failed `npm trust` is reported with the
 * command to run by hand, and the remaining packages are still bootstrapped.
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
    const untrusted: string[] = [];
    for (const pkg of missing) {
      logger.info(`Bootstrapping ${pkg.packageName} (${pkg.project})`);
      const settings = { repository, workflow, dryRun, cwd: context.root };
      exec('npm', ['publish', pkg.packageRoot, '--access=public'], settings);
      try {
        exec('npm', trustArgs(pkg.packageName, settings), settings);
      } catch (error) {
        logger.error(`npm trust failed for ${pkg.packageName}: ${errorMessage(error)}`);
        untrusted.push(pkg.packageName);
      }
    }

    if (untrusted.length > 0) {
      logger.error(
        [
          'These packages were published, but trusted publishing is not configured. Rerunning the executor skips them ' +
            'because they now exist on npm, so run the commands yourself:',
          ...untrusted.map((name) => `  npm ${trustArgs(name, { repository, workflow }).join(' ')}`),
        ].join('\n'),
      );
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    logger.error(errorMessage(error));
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
 * @throws When npm fails for any reason other than a missing package (`E404`), for example a network or
 *   authentication error, so that the executor never tries to publish a package that may already exist.
 */
function isPublished(packageName: string): boolean {
  try {
    run('npm', ['view', packageName, 'name'], { stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch (error) {
    const { stdout, stderr } = error as { stdout?: unknown; stderr?: unknown };
    const output = [stderr, stdout].map((value) => String(value ?? '')).join('\n');
    if (/\bE404\b/.test(output)) {
      return false;
    }

    throw new Error(`Unable to check whether ${packageName} exists on npm: ${output.trim() || errorMessage(error)}`, {
      cause: error,
    });
  }
}

/**
 * Builds the `npm trust github` arguments that allow the publish workflow to publish a package.
 *
 * @param packageName The npm package name.
 * @param settings The resolved repository and workflow.
 * @param settings.repository The GitHub repository in `owner/name` form.
 * @param settings.workflow The workflow file name.
 * @returns The npm arguments.
 */
function trustArgs(packageName: string, { repository, workflow }: { repository: string; workflow: string }): string[] {
  return ['trust', 'github', packageName, `--file=${workflow}`, `--repo=${repository}`, '--allow-publish', '--yes'];
}

/**
 * Reads the message of a thrown value.
 *
 * @param error The thrown value.
 * @returns The error message.
 */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

  execCommand(command, args, { stdio: 'inherit', cwd });
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
  return String(execCommand(command, args, { encoding: 'utf8', ...options }) ?? '').trim();
}

/**
 * Runs a command synchronously. On Windows, `npm` and `npx` are `.cmd` shims that Node only starts through a shell,
 * so the command line is built with quoted arguments and run with `shell: true`.
 *
 * @param command The executable to run.
 * @param args The command arguments.
 * @param options The exec options.
 * @returns The command output, if it was piped.
 */
function execCommand(command: string, args: string[], options: ExecFileSyncOptions): string | Buffer {
  if (process.platform === 'win32') {
    return execFileSync([command, ...args].map(quoteWindowsArgument).join(' '), { ...options, shell: true });
  }

  return execFileSync(command, args, options);
}

/**
 * Quotes an argument for the Windows command shell when it contains characters other than the ones that are safe in
 * package names, paths and flags.
 *
 * @param arg The argument.
 * @returns The argument, wrapped in double quotes when needed.
 */
function quoteWindowsArgument(arg: string): string {
  return /^[\w@./:=,+-]+$/.test(arg) ? arg : `"${arg.replace(/"/g, '""')}"`;
}
