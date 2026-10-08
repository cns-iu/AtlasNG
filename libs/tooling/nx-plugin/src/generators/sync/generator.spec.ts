import {
  addProjectConfiguration,
  readJson,
  readNxJson,
  type Tree,
  updateNxJson,
  writeJson,
  type NxJsonConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { flushChanges, FsTree } from 'nx/src/generators/tree';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AGENTS_END,
  AGENTS_START,
  isExcluded,
  JSON_FILES,
  renderTemplate,
  SYNC_GENERATOR,
  syncGenerator,
  WHOLE_FILES,
} from './generator.ts';
import { mergeShared } from './merge.ts';

const template = (path: string) => readFileSync(join(import.meta.dirname, 'files', path), 'utf8');
const preset = JSON.parse(readFileSync(join(import.meta.dirname, '../../../presets/nx.json'), 'utf8'));

const setOptions = (tree: Tree, options: Record<string, unknown>) => {
  const nxJson = readNxJson(tree) ?? {};
  updateNxJson(tree, { ...nxJson, sync: { generatorOptions: { [SYNC_GENERATOR]: options } } });
};

describe('sync generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('whole files', () => {
    it('writes every whole file from its template', async () => {
      await syncGenerator(tree, { prefix: 'my' });

      for (const file of WHOLE_FILES) {
        expect(tree.exists(file.path)).toBe(true);
      }
      expect(tree.read('.editorconfig', 'utf8')).toBe(template('editorconfig'));
      expect(tree.read('.nvmrc', 'utf8')).toBe(template('nvmrc'));
      expect(tree.read('.husky/commit-msg', 'utf8')).toBe(template('husky/commit-msg'));
    });

    it('fills in the selector prefix', async () => {
      await syncGenerator(tree, { prefix: 'my' });

      const angular = tree.read('.github/instructions/angular.instructions.md', 'utf8');
      expect(angular).toContain('`my` selectors');
      expect(angular).toContain('`my-<component>--<element-or-state>`');
      expect(angular).not.toContain('{{prefix}}');
    });

    it('replaces local edits', async () => {
      tree.write('.editorconfig', 'root = false\n');

      await syncGenerator(tree);

      expect(tree.read('.editorconfig', 'utf8')).toBe(template('editorconfig'));
    });

    it('makes the husky hooks executable', async () => {
      await syncGenerator(tree);

      const hooks = tree.listChanges().filter((change) => change.path.startsWith('.husky/'));
      expect(hooks).toHaveLength(2);
      for (const hook of hooks) {
        expect(hook.options).toEqual({ mode: 0o755 });
      }
    });
  });

  describe('team skills', () => {
    it('writes the shipped atlasng skills', async () => {
      await syncGenerator(tree);

      expect(tree.read('.agents/skills/atlasng-conventions/SKILL.md', 'utf8')).toBe(
        template('skills/atlasng-conventions/SKILL.md'),
      );
    });

    it('removes atlasng skills and files the plugin no longer ships and keeps other skills', async () => {
      tree.write('.agents/skills/atlasng-retired/SKILL.md', 'old');
      tree.write('.agents/skills/atlasng-conventions/notes/extra.md', 'stale');
      tree.write('.agents/skills/nx-workspace/SKILL.md', 'nx');

      await syncGenerator(tree);

      expect(tree.exists('.agents/skills/atlasng-retired/SKILL.md')).toBe(false);
      expect(tree.exists('.agents/skills/atlasng-conventions/notes/extra.md')).toBe(false);
      expect(tree.read('.agents/skills/nx-workspace/SKILL.md', 'utf8')).toBe('nx');
    });
  });

  describe('JSON merges', () => {
    it('creates the JSON files when they are missing', async () => {
      await syncGenerator(tree);

      for (const file of JSON_FILES) {
        expect(tree.exists(file.path)).toBe(true);
      }
      expect(readJson(tree, '.mcp.json').mcpServers['angular-cli']).toEqual({
        command: 'npx',
        args: ['-y', '@angular/cli', 'mcp'],
      });
    });

    it('keeps local keys and entries', async () => {
      writeJson(tree, '.vscode/extensions.json', { recommendations: ['local.extension', 'angular.ng-template'] });
      writeJson(tree, '.mcp.json', { mcpServers: { figma: { type: 'http', url: 'https://example.com' } } });
      writeJson(tree, '.claude/settings.json', {
        enabledPlugins: { 'local@market': true, 'nx@nx-claude-plugins': false },
        sandbox: { enabled: true },
      });

      await syncGenerator(tree);

      const { recommendations } = readJson(tree, '.vscode/extensions.json');
      expect(recommendations.slice(0, 2)).toEqual(['local.extension', 'angular.ng-template']);
      expect(recommendations).toContain('nrwl.angular-console');
      expect(new Set(recommendations).size).toBe(recommendations.length);
      expect(Object.keys(readJson(tree, '.mcp.json').mcpServers)).toEqual(['figma', 'angular-cli']);
      const claude = readJson(tree, '.claude/settings.json');
      expect(claude.enabledPlugins).toEqual({ 'local@market': true, 'nx@nx-claude-plugins': true });
      expect(claude.sandbox).toEqual({ enabled: true });
      expect(claude.extraKnownMarketplaces['nx-claude-plugins']).toBeDefined();
    });

    it('computes the commit scopes from the projects and the extra scopes', async () => {
      addProjectConfiguration(tree, 'zeta', { root: 'libs/zeta' });
      addProjectConfiguration(tree, 'Alpha', { root: 'apps/alpha' });
      addProjectConfiguration(tree, 'beta', { root: 'libs/beta' });
      writeJson(tree, '.vscode/settings.json', {
        'editor.formatOnSave': true,
        'conventionalCommits.scopes': ['removed-project'],
        'nxConsole.generatorAllowlist': ['@local/plugin:*'],
      });
      setOptions(tree, { extraScopes: ['release'] });

      await syncGenerator(tree);

      const settings = readJson(tree, '.vscode/settings.json');
      expect(settings['conventionalCommits.scopes']).toEqual(['Alpha', 'beta', 'release', 'zeta']);
      expect(settings['editor.formatOnSave']).toBe(true);
      expect(settings['nxConsole.generatorAllowlist'][0]).toBe('@local/plugin:*');
      expect(settings['nxConsole.generatorAllowlist']).toContain('@nx/angular:*');
      expect(settings['nxConsole.generatorBlocklist']).toContain('@nx/angular:host');
    });

    it('merges the preset into nx.json and keeps local entries', async () => {
      const nxJson = readNxJson(tree) as NxJsonConfiguration;
      updateNxJson(tree, {
        ...nxJson,
        namedInputs: { production: ['default', '!{projectRoot}/local/**'], local: ['{projectRoot}/x'] },
        targetDefaults: {
          custom: { cache: true },
          test: { cache: false, inputs: ['default', 'local'] },
        },
        generators: { '@nx/angular:library': { tags: 'library' } },
        release: { projects: ['*'] },
      });

      await syncGenerator(tree, { prefix: 'my' });

      const result = readNxJson(tree) as NxJsonConfiguration & Record<string, never>;
      expect(result.namedInputs?.['local']).toEqual(['{projectRoot}/x']);
      expect(result.namedInputs?.['production']?.slice(0, 2)).toEqual(['default', '!{projectRoot}/local/**']);
      expect(result.namedInputs?.['production']).toEqual(expect.arrayContaining(preset.namedInputs.production));
      expect(result.targetDefaults?.['custom']).toEqual({ cache: true });
      expect(result.targetDefaults?.['test']?.cache).toBe(true);
      expect(result.targetDefaults?.['test']?.inputs).toEqual(['default', 'local', '^production']);
      expect(result.targetDefaults?.['@nx/angular:package']).toEqual(preset.targetDefaults['@nx/angular:package']);
      expect(result.generators?.['@nx/angular:library']).toEqual({
        ...preset.generators['@nx/angular:library'],
        tags: 'library',
        prefix: 'my',
      });
      expect(result.generators?.['@nx/angular:directive']).toEqual({ prefix: 'my' });
      expect(result.release).toEqual({ projects: ['*'] });
    });

    it('reads the prefix from the nx.json generator defaults', async () => {
      const nxJson = readNxJson(tree) as NxJsonConfiguration;
      updateNxJson(tree, { ...nxJson, generators: { '@nx/angular:component': { prefix: 'cmp' } } });

      await syncGenerator(tree);

      expect(tree.read('.github/instructions/angular.instructions.md', 'utf8')).toContain('`cmp` selectors');
    });

    it('falls back to the app prefix', async () => {
      await syncGenerator(tree);

      expect(readNxJson(tree)?.generators?.['@nx/angular:component']).toMatchObject({ prefix: 'app' });
    });
  });

  describe('AGENTS.md', () => {
    it('creates the file with the managed section', async () => {
      tree.delete('AGENTS.md');

      await syncGenerator(tree);

      const agents = tree.read('AGENTS.md', 'utf8') ?? '';
      expect(agents.startsWith(AGENTS_START)).toBe(true);
      expect(agents.trimEnd().endsWith(AGENTS_END)).toBe(true);
      expect(agents).toContain('## Commit Messages');
    });

    it('appends the managed section after the existing content', async () => {
      tree.write('AGENTS.md', '# Local\n\nKeep me.\n');

      await syncGenerator(tree, { extraScopes: ['release', 'deps'] });

      const agents = tree.read('AGENTS.md', 'utf8') ?? '';
      expect(agents.startsWith('# Local\n\nKeep me.\n\n' + AGENTS_START)).toBe(true);
      expect(agents).toContain('`npx nx show projects`, plus `release` and `deps`)');
    });

    it('updates only the content between the markers', async () => {
      tree.write(
        'AGENTS.md',
        `<!-- nx configuration start-->\nnx\n<!-- nx configuration end-->\n\n## Before\n\n${AGENTS_START}\nold\n${AGENTS_END}\n\n## After\n`,
      );

      await syncGenerator(tree, { extraScopes: ['release'] });

      const agents = tree.read('AGENTS.md', 'utf8') ?? '';
      expect(agents).toContain('<!-- nx configuration start-->\nnx\n<!-- nx configuration end-->\n\n## Before\n');
      expect(agents).toContain(`${AGENTS_END}\n\n## After\n`);
      expect(agents).not.toContain('\nold\n');
      expect(agents).toContain('`npx nx show projects`, plus `release`)');
      expect(agents.split(AGENTS_START)).toHaveLength(2);
    });

    it('leaves out the scope note without extra scopes', async () => {
      await syncGenerator(tree);

      expect(tree.read('AGENTS.md', 'utf8')).toContain('(Nx project names from `npx nx show projects`);');
    });
  });

  describe('exclude', () => {
    it('skips excluded ids, paths and directories', async () => {
      const nxJsonBefore = tree.read('nx.json', 'utf8');
      setOptions(tree, {
        exclude: ['nvmrc', '.editorconfig', '.github/instructions/', 'skills', 'nx-json', 'agents-md', 'mcp'],
      });
      const nxJsonWithOptions = tree.read('nx.json', 'utf8');
      tree.write('.agents/skills/atlasng-retired/SKILL.md', 'old');

      await syncGenerator(tree);

      expect(nxJsonBefore).not.toBe(nxJsonWithOptions);
      expect(tree.read('nx.json', 'utf8')).toBe(nxJsonWithOptions);
      for (const path of [
        '.nvmrc',
        '.editorconfig',
        '.github/instructions/angular.instructions.md',
        '.github/instructions/testing.instructions.md',
        '.agents/skills/atlasng-conventions/SKILL.md',
        '.mcp.json',
      ]) {
        expect(tree.exists(path)).toBe(false);
      }
      expect(tree.exists('.agents/skills/atlasng-retired/SKILL.md')).toBe(true);
      expect(tree.exists('.gitattributes')).toBe(true);
      expect(tree.exists('.vscode/settings.json')).toBe(true);
    });

    it('lets passed options take precedence over nx.json', async () => {
      setOptions(tree, { exclude: ['nvmrc'] });

      await syncGenerator(tree, { exclude: [] });

      expect(tree.exists('.nvmrc')).toBe(true);
    });
  });

  describe('on disk', () => {
    let root: string;

    const diskTree = () => new FsTree(root, false);

    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), 'atlasng-sync-'));
      writeFileSync(join(root, 'nx.json'), '{}\n');
      writeFileSync(join(root, 'package.json'), '{ "name": "scratch" }\n');
    });

    afterEach(() => {
      rmSync(root, { recursive: true, force: true });
    });

    const sync = async () => {
      const fsTree = diskTree();
      const result = await syncGenerator(fsTree);
      flushChanges(root, fsTree.listChanges());
      return result;
    };

    it('reports the changed files and is idempotent', async () => {
      const first = await sync();

      expect(first?.outOfSyncMessage).toContain('out of date');
      expect(first?.outOfSyncDetails).toContain('create: .editorconfig');
      expect(statSync(join(root, '.husky/pre-commit')).mode & 0o777).toBe(0o755);

      const second = diskTree();
      expect(await syncGenerator(second)).toBeUndefined();
      expect(second.listChanges()).toEqual([]);
    });

    it('detects drift in a managed file', async () => {
      await sync();
      writeFileSync(join(root, '.editorconfig'), 'root = false\n');

      const result = await syncGenerator(diskTree());

      expect(result?.outOfSyncDetails).toEqual(['update: .editorconfig']);
    });

    it('restores a missing executable bit', async () => {
      await sync();
      chmodSync(join(root, '.husky/commit-msg'), 0o644);

      const fsTree = diskTree();
      const result = await syncGenerator(fsTree);
      flushChanges(root, fsTree.listChanges());

      expect(result?.outOfSyncDetails).toEqual(['update: .husky/commit-msg']);
      expect(statSync(join(root, '.husky/commit-msg')).mode & 0o777).toBe(0o755);
    });

    it('keeps JSON comments when nothing changes', async () => {
      await sync();
      const settings = readFileSync(join(root, '.claude/settings.json'), 'utf8');
      writeFileSync(join(root, '.claude/settings.json'), `// local comment\n${settings}`);

      expect(await syncGenerator(diskTree())).toBeUndefined();
    });
  });
});

describe('isExcluded', () => {
  it('matches ids, paths and parent directories', () => {
    expect(isExcluded(['nvmrc'], 'nvmrc', '.nvmrc')).toBe(true);
    expect(isExcluded(['./.nvmrc'], 'nvmrc', '.nvmrc')).toBe(true);
    expect(isExcluded(['.husky'], 'husky-commit-msg', '.husky/commit-msg')).toBe(true);
    expect(isExcluded(['.hus'], 'husky-commit-msg', '.husky/commit-msg')).toBe(false);
    expect(isExcluded([], 'nvmrc', '.nvmrc')).toBe(false);
  });
});

describe('renderTemplate', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(renderTemplate('{{prefix}}-a {{other}}', { prefix: 'my' })).toBe('my-a {{other}}');
  });
});

describe('mergeShared', () => {
  it('merges objects, unions arrays and replaces scalars', () => {
    const local = { a: 1, list: [1, { x: 1 }], nested: { keep: true, value: 'old' } };
    const shared = { list: [{ x: 1 }, 2], nested: { value: 'new' }, added: [3] };

    const result = mergeShared(local, shared);

    expect(result).toEqual({ a: 1, list: [1, { x: 1 }, 2], nested: { keep: true, value: 'new' }, added: [3] });
    expect(local.nested.value).toBe('old');
  });

  it('replaces values of a different type', () => {
    expect(mergeShared('local', { a: 1 })).toEqual({ a: 1 });
    expect(mergeShared({ a: 1 }, [1])).toEqual([1]);
  });
});
