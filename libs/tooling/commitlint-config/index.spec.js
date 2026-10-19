// @ts-check
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from './index.js';

/**
 * @param {string} root
 * @param {string} dir
 * @param {Record<string, unknown>} project
 */
function writeProject(root, dir, project) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.writeFileSync(path.join(root, dir, 'project.json'), JSON.stringify(project));
}

describe('@atlasng/commitlint-config', () => {
  /** @type {string} */
  let workspace;

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'commitlint-config-'));
    fs.writeFileSync(path.join(workspace, 'nx.json'), '{}');
    fs.writeFileSync(path.join(workspace, 'package.json'), JSON.stringify({ name: 'root' }));
    writeProject(workspace, 'apps/app', { name: 'app', projectType: 'application', tags: ['application'] });
    writeProject(workspace, 'libs/lib', { name: 'lib', projectType: 'library', tags: ['library'] });
    writeProject(workspace, 'libs/scoped', { name: '@org/scoped', projectType: 'library', tags: ['tooling'] });
  });

  afterEach(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('extends the conventional configuration', () => {
    expect(config.extends).toEqual(['@commitlint/config-conventional']);
  });

  describe('scope-enum', () => {
    it('lists the Nx project names', async () => {
      const [severity, applicable, scopes] = await config.rules['scope-enum']({ cwd: workspace });

      expect(severity).toBe(2);
      expect(applicable).toBe('always');
      expect([...scopes].sort()).toEqual(['app', 'lib', 'scoped']);
    });

    it('returns no scopes outside an Nx workspace', async () => {
      fs.rmSync(path.join(workspace, 'nx.json'));

      await expect(config.rules['scope-enum']({ cwd: workspace })).resolves.toEqual([2, 'always', []]);
    });

    it('defaults to the current working directory', async () => {
      vi.spyOn(process, 'cwd').mockReturnValue(workspace);

      const [, , scopes] = await config.rules['scope-enum']();

      expect([...scopes].sort()).toEqual(['app', 'lib', 'scoped']);
    });
  });

  describe('utils.getProjects', () => {
    it('filters projects with a selector', () => {
      const scopes = config.utils.getProjects({ cwd: workspace }, ({ tags }) => !!tags?.includes('library'));

      expect(scopes).toEqual(['lib']);
    });

    it('passes the project type to the selector', () => {
      const scopes = config.utils.getProjects({ cwd: workspace }, ({ projectType }) => projectType === 'application');

      expect(scopes).toEqual(['app']);
    });
  });

  describe('ignores', () => {
    it('ignores Nx self-healing CI commits', () => {
      const [ignore] = config.ignores;

      expect(ignore('fix: apply fix\n\n[Self-Healing CI Rerun]')).toBe(true);
      expect(ignore('fix: apply fix [self-healing ci rerun]')).toBe(true);
    });

    it('does not ignore regular commits', () => {
      expect(config.utils.isNxSelfHealingCommit('feat(lib): add feature')).toBe(false);
    });
  });
});
