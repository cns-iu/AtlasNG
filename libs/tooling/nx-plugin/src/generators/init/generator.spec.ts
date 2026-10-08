import { logger, readJson, readNxJson, type Tree, updateNxJson, writeJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { execFileSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_PACKAGES, eslintConfig, initGenerator, PLUGIN_NAME, resolveVersionRange } from './generator.ts';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));

const exec = vi.mocked(execFileSync);

describe('init generator', () => {
  let tree: Tree;

  const snapshot = () =>
    Object.fromEntries(tree.listChanges().map((change) => [change.path, change.content?.toString()]));

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    exec.mockReturnValue('1.2.3\n');
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    exec.mockReset();
  });

  it('adds the config packages as devDependencies', async () => {
    await initGenerator(tree, { skipFormat: true });

    const { devDependencies } = readJson(tree, 'package.json');
    for (const name of CONFIG_PACKAGES) {
      expect(devDependencies[name]).toBe('^1.2.3');
    }
  });

  it('keeps declared package versions', async () => {
    writeJson(tree, 'package.json', { devDependencies: { '@atlasng/tsconfig': '~0.1.0' } });

    await initGenerator(tree, { skipFormat: true });

    expect(readJson(tree, 'package.json').devDependencies['@atlasng/tsconfig']).toBe('~0.1.0');
    expect(exec).not.toHaveBeenCalledWith('npm', ['view', '@atlasng/tsconfig', 'version'], expect.anything());
  });

  it('skips package.json dependencies when asked', async () => {
    const task = await initGenerator(tree, { skipFormat: true, skipPackageJson: true });

    expect(readJson(tree, 'package.json').devDependencies).toEqual({});
    expect(task()).toBeUndefined();
  });

  it('writes the thin configs', async () => {
    await initGenerator(tree, { skipFormat: true, prefix: 'my' });

    expect(tree.read('eslint.config.mjs', 'utf8')).toBe(eslintConfig('my'));
    expect(tree.read('commitlint.config.mjs', 'utf8')).toContain("extends: ['@atlasng']");
    expect(readJson(tree, 'package.json').prettier).toBe('@atlasng/prettier-config');
    expect(readJson(tree, 'tsconfig.base.json')).toEqual({
      extends: '@atlasng/tsconfig/angular.json',
      compilerOptions: { paths: {} },
    });
    expect(Object.keys(readJson(tree, 'tsconfig.base.json'))[0]).toBe('extends');
  });

  it('reads the selector prefix from the nx.json generator defaults', async () => {
    const nxJson = readNxJson(tree) ?? {};
    updateNxJson(tree, { ...nxJson, generators: { '@nx/angular:library': { prefix: 'lib' } } });

    await initGenerator(tree, { skipFormat: true });

    expect(tree.read('eslint.config.mjs', 'utf8')).toContain("prefix: 'lib'");
  });

  it('defaults the selector prefix to app', async () => {
    await initGenerator(tree, { skipFormat: true });

    expect(tree.read('eslint.config.mjs', 'utf8')).toContain("prefix: 'app'");
  });

  it('registers the plugin in nx.json', async () => {
    await initGenerator(tree, { skipFormat: true });

    expect(readNxJson(tree)?.plugins).toEqual([
      { plugin: PLUGIN_NAME, options: { buildCompodocTargetName: 'build-compodoc', compodocTargetName: 'compodoc' } },
    ]);
  });

  it('keeps an existing plugin registration', async () => {
    const nxJson = readNxJson(tree) ?? {};
    updateNxJson(tree, { ...nxJson, plugins: ['@nx/eslint/plugin', PLUGIN_NAME] });

    await initGenerator(tree, { skipFormat: true });

    expect(readNxJson(tree)?.plugins).toEqual(['@nx/eslint/plugin', PLUGIN_NAME]);
  });

  it('is idempotent', async () => {
    await initGenerator(tree, { skipFormat: true });
    const first = snapshot();

    await initGenerator(tree, { skipFormat: true });

    expect(snapshot()).toEqual(first);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('formats the files by default', async () => {
    await initGenerator(tree);

    expect(tree.exists('eslint.config.mjs')).toBe(true);
  });

  it('keeps custom ESLint, Prettier and commitlint configs', async () => {
    tree.write('eslint.config.mjs', 'export default [];\n');
    tree.write('.prettierrc', JSON.stringify({ singleQuote: true, semi: false }));
    tree.write('.commitlintrc.json', '{}');

    await initGenerator(tree, { skipFormat: true });

    expect(tree.read('eslint.config.mjs', 'utf8')).toBe('export default [];\n');
    expect(tree.read('.prettierrc', 'utf8')).toContain('semi');
    expect(readJson(tree, 'package.json').prettier).toBeUndefined();
    expect(tree.exists('commitlint.config.mjs')).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      'eslint.config.mjs already exists. Extend the configs from @atlasng/eslint-plugin manually.',
    );
  });

  it('keeps a custom prettier key and a commitlint key in package.json', async () => {
    writeJson(tree, 'package.json', { prettier: 'other-config', commitlint: { extends: ['x'] } });

    await initGenerator(tree, { skipFormat: true, skipPackageJson: true });

    expect(readJson(tree, 'package.json').prettier).toBe('other-config');
    expect(tree.exists('commitlint.config.mjs')).toBe(false);
  });

  it('replaces the default Nx .prettierrc', async () => {
    tree.write('.prettierrc', JSON.stringify({ singleQuote: true }));

    await initGenerator(tree, { skipFormat: true });

    expect(tree.exists('.prettierrc')).toBe(false);
    expect(readJson(tree, 'package.json').prettier).toBe('@atlasng/prettier-config');
  });

  it('keeps an unparsable .prettierrc', async () => {
    tree.write('.prettierrc', 'singleQuote: true\n');

    await initGenerator(tree, { skipFormat: true });

    expect(tree.exists('.prettierrc')).toBe(true);
  });

  it('keeps an existing tsconfig extends', async () => {
    writeJson(tree, 'tsconfig.base.json', { extends: './other.json', compilerOptions: {} });

    await initGenerator(tree, { skipFormat: true, tsconfigPreset: 'node' });

    expect(readJson(tree, 'tsconfig.base.json').extends).toBe('./other.json');
    expect(logger.warn).toHaveBeenCalledWith(
      'tsconfig.base.json already extends "./other.json". Add "@atlasng/tsconfig/node.json" manually if needed.',
    );
  });

  it('creates tsconfig.base.json when missing', async () => {
    tree.delete('tsconfig.base.json');

    await initGenerator(tree, { skipFormat: true, tsconfigPreset: 'node' });

    expect(readJson(tree, 'tsconfig.base.json')).toEqual({
      extends: '@atlasng/tsconfig/node.json',
      compilerOptions: {},
    });
  });

  describe('resolveVersionRange', () => {
    it('falls back to latest when the registry is unavailable', () => {
      exec.mockImplementation(() => {
        throw new Error('offline');
      });

      expect(resolveVersionRange('@atlasng/tsconfig')).toBe('latest');
    });

    it('falls back to latest for an empty response', () => {
      exec.mockReturnValue('\n');

      expect(resolveVersionRange('@atlasng/tsconfig')).toBe('latest');
    });
  });
});
