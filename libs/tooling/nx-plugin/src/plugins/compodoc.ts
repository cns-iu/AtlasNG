import {
  type CreateNodesContext,
  type CreateNodesResult,
  type CreateNodes,
  createNodesFromFiles,
  type TargetConfiguration,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Options accepted by the compodoc inference plugin in `nx.json`. */
export interface CompodocPluginOptions {
  /** Name of the inferred target that builds the static Compodoc site. Defaults to `build-compodoc`. */
  buildCompodocTargetName?: string;
  /** Name of the inferred target that serves Compodoc in watch mode. Defaults to `compodoc`. */
  compodocTargetName?: string;
}

/** Glob that identifies Angular libraries built with ng-packagr. */
const NG_PACKAGE_GLOB = '**/ng-package.json';

/** TypeScript configuration that Compodoc reads, relative to the project root. */
const TSCONFIG_FILE = 'tsconfig.lib.json';

/** Files that mark a directory as an Nx project rather than an ng-packagr secondary entry point. */
const PROJECT_FILES = ['project.json', 'package.json'];

/**
 * Compodoc command shared by the build and serve targets. Writes to `dist/compodoc/{projectName}`.
 * `${PWD%/{projectRoot}}` is a shell expansion that resolves the workspace root from the project directory.
 */
const COMPODOC_COMMAND =
  // eslint-disable-next-line no-template-curly-in-string -- shell parameter expansion, not a JS template
  'npx compodoc -p tsconfig.lib.json -d ${PWD%/{projectRoot}}/dist/compodoc/{projectName} -n {projectName}';

/**
 * Infers Compodoc targets for every Angular library that has an `ng-package.json`, a `tsconfig.lib.json` and a
 * `project.json` or `package.json` next to it.
 */
export const createNodesV2: CreateNodes<CompodocPluginOptions> = [
  NG_PACKAGE_GLOB,
  (configFiles, options, context) =>
    createNodesFromFiles((file, opts, ctx) => createNodesInternal(file, opts, ctx), configFiles, options, context),
];

/** Alias of {@link createNodesV2} under the name Nx 23 prefers. */
export const createNodes = createNodesV2;

/**
 * Builds the inferred project configuration for a single `ng-package.json`.
 *
 * @param configFile Path of the `ng-package.json`, relative to the workspace root.
 * @param options Plugin options from `nx.json`.
 * @param context The Nx create-nodes context.
 * @returns The inferred targets keyed by project root, or an empty result when the file is not a project root.
 */
function createNodesInternal(
  configFile: string,
  options: CompodocPluginOptions | undefined,
  context: CreateNodesContext,
): CreateNodesResult {
  const projectRoot = dirname(configFile);
  const absoluteRoot = join(context.workspaceRoot, projectRoot);
  const isProjectRoot = PROJECT_FILES.some((file) => existsSync(join(absoluteRoot, file)));
  if (!isProjectRoot || !existsSync(join(absoluteRoot, TSCONFIG_FILE))) {
    return {};
  }

  const { buildCompodocTargetName, compodocTargetName } = normalizeOptions(options);
  return {
    projects: {
      [projectRoot]: {
        targets: {
          [buildCompodocTargetName]: buildCompodocTarget(),
          [compodocTargetName]: compodocTarget(),
        },
      },
    },
  };
}

/**
 * Fills in default target names.
 *
 * @param options The options from `nx.json`, if any.
 * @returns Options with every target name set.
 */
function normalizeOptions(options: CompodocPluginOptions | undefined): Required<CompodocPluginOptions> {
  return {
    buildCompodocTargetName: options?.buildCompodocTargetName ?? 'build-compodoc',
    compodocTargetName: options?.compodocTargetName ?? 'compodoc',
  };
}

/**
 * Creates the cached target that builds the static documentation site.
 *
 * @returns The target configuration.
 */
function buildCompodocTarget(): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    cache: true,
    inputs: ['default', { externalDependencies: ['@compodoc/compodoc'] }],
    outputs: ['{workspaceRoot}/dist/compodoc/{projectName}'],
    options: {
      commands: [COMPODOC_COMMAND],
      cwd: '{projectRoot}',
    },
  };
}

/**
 * Creates the continuous target that serves the documentation and rebuilds it on change.
 *
 * @returns The target configuration.
 */
function compodocTarget(): TargetConfiguration {
  return {
    executor: 'nx:run-commands',
    continuous: true,
    options: {
      commands: [`${COMPODOC_COMMAND} --serve --watch`],
      cwd: '{projectRoot}',
    },
  };
}
