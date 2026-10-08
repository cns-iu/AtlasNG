import {
  addDependenciesToPackageJson,
  formatFiles,
  type GeneratorCallback,
  logger,
  readJson,
  readNxJson,
  type Tree,
  updateJson,
  updateNxJson,
} from '@nx/devkit';
import { execFileSync } from 'node:child_process';

/** Options for the `init` generator. */
export interface InitGeneratorSchema {
  /** Angular selector prefix written to the ESLint selector rules. Defaults to the `nx.json` generator prefix. */
  prefix?: string;
  /** The `@atlasng/tsconfig` preset that `tsconfig.base.json` extends. */
  tsconfigPreset?: 'angular' | 'node';
  /** Do not add the config packages to `package.json`. */
  skipPackageJson?: boolean;
  /** Do not format the changed files. */
  skipFormat?: boolean;
}

/** Name of this plugin, as registered in `nx.json`. */
export const PLUGIN_NAME = '@atlasng/nx-plugin';

/** The shared config packages that the generated files import. */
export const CONFIG_PACKAGES = [
  '@atlasng/eslint-plugin',
  '@atlasng/prettier-config',
  '@atlasng/commitlint-config',
  '@atlasng/tsconfig',
] as const;

/** Prettier configuration files that take precedence over the `prettier` key in `package.json`. */
const PRETTIER_CONFIG_FILES = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.json5',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  '.prettierrc.toml',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
  '.prettierrc.ts',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  'prettier.config.ts',
];

/** Commitlint configuration files recognized by commitlint. */
const COMMITLINT_CONFIG_FILES = [
  '.commitlintrc',
  '.commitlintrc.json',
  '.commitlintrc.yaml',
  '.commitlintrc.yml',
  '.commitlintrc.js',
  '.commitlintrc.cjs',
  '.commitlintrc.mjs',
  '.commitlintrc.ts',
  '.commitlintrc.cts',
  'commitlint.config.js',
  'commitlint.config.cjs',
  'commitlint.config.mjs',
  'commitlint.config.ts',
  'commitlint.config.cts',
  'commitlint.config.mts',
];

/**
 * Sets up a workspace to use the shared AtlasNG tooling. Runs through `nx add @atlasng/nx-plugin`.
 * Existing custom configuration is kept; files that already exist are only changed when the change is additive.
 *
 * @param tree The virtual file system.
 * @param options The generator options.
 * @returns A callback that installs the added packages.
 */
export async function initGenerator(tree: Tree, options: InitGeneratorSchema = {}): Promise<GeneratorCallback> {
  const installTask = options.skipPackageJson ? () => undefined : addConfigPackages(tree);

  writeEslintConfig(tree, options.prefix ?? readPrefix(tree));
  configurePrettier(tree);
  writeCommitlintConfig(tree);
  extendTsconfig(tree, options.tsconfigPreset ?? 'angular');
  registerPlugin(tree);

  // TODO(nx-plugin-sync): register `@atlasng/nx-plugin:sync` under `nx.json` `sync.globalGenerators`
  // and run it here once the global sync generator exists.

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return installTask;
}

export default initGenerator;

/**
 * Adds the shared config packages as devDependencies, keeping any version that is already declared.
 *
 * @param tree The virtual file system.
 * @returns A callback that installs the packages.
 */
function addConfigPackages(tree: Tree): GeneratorCallback {
  const packageJson = readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    tree,
    'package.json',
  );
  const declared = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const missing = CONFIG_PACKAGES.filter((name) => !declared[name]);
  const devDependencies = Object.fromEntries(missing.map((name) => [name, resolveVersionRange(name)]));
  return addDependenciesToPackageJson(tree, {}, devDependencies, 'package.json', true);
}

/**
 * Resolves a caret range for the latest published version of a package, falling back to `latest` when the
 * registry cannot be reached.
 *
 * @param packageName The npm package name.
 * @returns The version range to write to `package.json`.
 */
export function resolveVersionRange(packageName: string): string {
  try {
    const version = execFileSync('npm', ['view', packageName, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return version ? `^${version}` : 'latest';
  } catch {
    return 'latest';
  }
}

/**
 * Reads the Angular selector prefix from the `nx.json` generator defaults.
 *
 * @param tree The virtual file system.
 * @returns The configured prefix, or `app`.
 */
function readPrefix(tree: Tree): string {
  const generators = (readNxJson(tree)?.generators ?? {}) as Record<string, { prefix?: string } | undefined>;
  return (
    generators['@nx/angular:component']?.prefix ??
    generators['@nx/angular:application']?.prefix ??
    generators['@nx/angular:library']?.prefix ??
    'app'
  );
}

/**
 * Writes the thin root `eslint.config.mjs` when the workspace has none.
 *
 * @param tree The virtual file system.
 * @param prefix The Angular selector prefix.
 */
function writeEslintConfig(tree: Tree, prefix: string): void {
  const path = 'eslint.config.mjs';
  if (tree.exists(path)) {
    if (!tree.read(path, 'utf8')?.includes('@atlasng/eslint-plugin')) {
      logger.warn(`${path} already exists. Extend the configs from @atlasng/eslint-plugin manually.`);
    }
    return;
  }

  tree.write(path, eslintConfig(prefix));
}

/**
 * Creates the contents of the root ESLint configuration.
 *
 * @param prefix The Angular selector prefix.
 * @returns The file contents.
 */
export function eslintConfig(prefix: string): string {
  return `import atlasng from '@atlasng/eslint-plugin';

/**
 * ESLint configuration built on the shared \`@atlasng/eslint-plugin\` configs.
 * Repo-specific rules, such as the selector prefix and the module boundaries, stay in this file.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default [
  ...atlasng.configs['flat/base'],
  ...atlasng.configs['flat/javascript'],
  ...atlasng.configs['flat/typescript'],
  ...atlasng.configs['flat/angular'],
  ...atlasng.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: '${prefix}', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: '${prefix}', style: 'kebab-case' }],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\\\.base)?\\\\.config\\\\.[cm]?[jt]s$'],
          depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }],
        },
      ],
    },
  },
];
`;
}

/**
 * Points the `prettier` key in `package.json` at the shared config. A default Nx `.prettierrc` that only sets
 * `singleQuote` is replaced; any other Prettier config file is kept.
 *
 * @param tree The virtual file system.
 */
function configurePrettier(tree: Tree): void {
  if (tree.exists('.prettierrc') && isDefaultNxPrettierrc(tree)) {
    tree.delete('.prettierrc');
  }

  const existing = PRETTIER_CONFIG_FILES.find((file) => tree.exists(file));
  const packageJson = readJson<{ prettier?: unknown }>(tree, 'package.json');
  if (existing || (packageJson.prettier !== undefined && packageJson.prettier !== '@atlasng/prettier-config')) {
    logger.warn(`A custom Prettier config is already set. Use "@atlasng/prettier-config" manually.`);
    return;
  }

  updateJson(tree, 'package.json', (json: Record<string, unknown>) => ({
    ...json,
    prettier: '@atlasng/prettier-config',
  }));
}

/**
 * Checks whether `.prettierrc` holds only the `singleQuote` option that new Nx workspaces start with.
 *
 * @param tree The virtual file system.
 * @returns Whether the file can be replaced by the shared config.
 */
function isDefaultNxPrettierrc(tree: Tree): boolean {
  try {
    const config = readJson<Record<string, unknown>>(tree, '.prettierrc');
    return Object.keys(config).length === 1 && config['singleQuote'] === true;
  } catch {
    return false;
  }
}

/**
 * Writes `commitlint.config.mjs` when no commitlint configuration exists.
 *
 * @param tree The virtual file system.
 */
function writeCommitlintConfig(tree: Tree): void {
  const packageJson = readJson<{ commitlint?: unknown }>(tree, 'package.json');
  if (packageJson.commitlint !== undefined || COMMITLINT_CONFIG_FILES.some((file) => tree.exists(file))) {
    return;
  }

  tree.write(
    'commitlint.config.mjs',
    `/**
 * Commitlint configuration that only accepts Nx project names as scopes.
 *
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@atlasng'],
};
`,
  );
}

/**
 * Makes `tsconfig.base.json` extend the shared preset unless it already extends another file.
 *
 * @param tree The virtual file system.
 * @param preset The `@atlasng/tsconfig` preset name.
 */
function extendTsconfig(tree: Tree, preset: 'angular' | 'node'): void {
  const path = 'tsconfig.base.json';
  const target = `@atlasng/tsconfig/${preset}.json`;
  if (!tree.exists(path)) {
    tree.write(path, JSON.stringify({ extends: target, compilerOptions: {} }));
    return;
  }

  const { extends: current } = readJson<{ extends?: string | string[] }>(tree, path);
  if (current === undefined) {
    updateJson(tree, path, (json: Record<string, unknown>) => ({ extends: target, ...json }));
  } else if (current !== target) {
    logger.warn(`${path} already extends ${JSON.stringify(current)}. Add "${target}" manually if needed.`);
  }
}

/**
 * Registers the plugin in `nx.json` so it infers its targets.
 *
 * @param tree The virtual file system.
 */
function registerPlugin(tree: Tree): void {
  const nxJson = readNxJson(tree) ?? {};
  const plugins = nxJson.plugins ?? [];
  const registered = plugins.some((entry) => (typeof entry === 'string' ? entry : entry.plugin) === PLUGIN_NAME);
  if (registered) {
    return;
  }

  nxJson.plugins = [
    ...plugins,
    {
      plugin: PLUGIN_NAME,
      options: {
        buildCompodocTargetName: 'build-compodoc',
        compodocTargetName: 'compodoc',
        buildStorybookCompodocTargetName: 'build-storybook-compodoc',
      },
    },
  ];
  updateNxJson(tree, nxJson);
}
