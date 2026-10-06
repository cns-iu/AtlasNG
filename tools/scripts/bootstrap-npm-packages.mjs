#!/usr/bin/env node

import { Command } from 'commander';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const REPOSITORY = 'cns-iu/AtlasNG';
const PUBLISH_WORKFLOW = 'publish.yml';

/**
 * Runs a command and returns its trimmed stdout.
 *
 * @param {string} command The executable to run.
 * @param {string[]} args The command arguments.
 * @param {import('node:child_process').ExecFileSyncOptions} [options] Additional exec options.
 * @returns {string} The trimmed stdout of the command.
 */
function run(command, args, options = {}) {
  return String(execFileSync(command, args, { encoding: 'utf8', ...options }) ?? '').trim();
}

/**
 * Lists the npm packages released by `nx release`, skipping the workspace root project.
 *
 * @returns {Promise<{ project: string, packageName: string }[]>} The release projects and their package names.
 */
async function getReleasePackages() {
  const projects = JSON.parse(run('npx', ['nx', 'show', 'projects', '--with-target', 'nx-release-publish', '--json']));
  const packages = [];
  for (const project of projects) {
    const { root } = JSON.parse(run('npx', ['nx', 'show', 'project', project, '--json']));
    if (root === '.') {
      continue;
    }

    const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
    packages.push({ project, packageName: manifest.name });
  }

  return packages;
}

/**
 * Checks whether a package already exists on the npm registry.
 *
 * @param {string} packageName The npm package name.
 * @returns {boolean} Whether the package has been published before.
 */
function isPublished(packageName) {
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
 * @param {{ project: string, packageName: string }} pkg The release project and its package name.
 * @param {{ dryRun?: boolean }} options Command options.
 */
function bootstrap({ project, packageName }, options) {
  const publishArgs = ['nx', 'run', `${project}:nx-release-publish`, '--access=public', '--firstRelease'];
  const trustArgs = [
    'trust',
    'github',
    packageName,
    `--file=${PUBLISH_WORKFLOW}`,
    `--repo=${REPOSITORY}`,
    '--allow-publish',
    '--yes',
  ];

  if (options.dryRun) {
    console.log(`[dry-run] npx ${publishArgs.join(' ')}`);
    console.log(`[dry-run] npm ${trustArgs.join(' ')}`);
    return;
  }

  execFileSync('npx', publishArgs, { stdio: 'inherit' });
  execFileSync('npm', trustArgs, { stdio: 'inherit' });
}

const program = new Command()
  .name('bootstrap-npm-packages')
  .description(
    'Publish release projects that do not exist on npm yet and configure trusted publishing for them, ' +
      'so that later releases can be published from CI.',
  )
  .option('--dry-run', 'Only print the commands that would run')
  .action(async (options) => {
    const missing = (await getReleasePackages()).filter(({ packageName }) => !isPublished(packageName));
    if (missing.length === 0) {
      console.log('All release packages already exist on npm.');
      return;
    }

    for (const pkg of missing) {
      console.log(`Bootstrapping ${pkg.packageName} (${pkg.project})`);
      bootstrap(pkg, options);
    }
  });

await program.parseAsync();
