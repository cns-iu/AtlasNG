import { type ExecutorContext, logger, type ProjectGraphProjectNode } from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import bootstrapNpmPackagesExecutor, { getGitHubRepository, getReleasePackages } from './executor.ts';

vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));

const exec = vi.mocked(execFileSync);

describe('bootstrap-npm-packages executor', () => {
  let root: string;
  let context: ExecutorContext;
  let published: Set<string>;

  const node = (name: string, projectRoot: string, publish = true): ProjectGraphProjectNode => ({
    name,
    type: 'lib',
    data: { root: projectRoot, targets: publish ? { 'nx-release-publish': {} } : {} },
  });

  const writePackage = (projectRoot: string, name: string) => {
    mkdirSync(join(root, projectRoot), { recursive: true });
    writeFileSync(join(root, projectRoot, 'package.json'), JSON.stringify({ name }));
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'bootstrap-npm-'));
    writePackage('libs/b', '@scope/b');
    writePackage('libs/a', '@scope/a');
    context = {
      root,
      cwd: root,
      isVerbose: false,
      projectGraph: {
        nodes: {
          root: node('root', '.'),
          b: node('b', 'libs/b'),
          a: node('a', 'libs/a'),
          app: node('app', 'apps/app', false),
        },
        dependencies: {},
      },
    } as unknown as ExecutorContext;
    published = new Set(['@scope/b']);
    exec.mockImplementation((command, args) => {
      const argv = args as string[];
      if (command === 'git') {
        return 'git@github.com:owner/repo.git\n';
      }
      if (command === 'npm' && argv[0] === 'view') {
        if (!published.has(argv[1] as string)) {
          throw new Error('E404');
        }
        return argv[1];
      }
      return '';
    });
    vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
    exec.mockReset();
  });

  it('lists release packages sorted by project, skipping the root project', async () => {
    expect(await getReleasePackages(context)).toEqual([
      { project: 'a', packageName: '@scope/a' },
      { project: 'b', packageName: '@scope/b' },
    ]);
  });

  it('publishes and trusts packages missing from npm', async () => {
    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: true });
    expect(exec).toHaveBeenCalledWith(
      'npx',
      ['nx', 'run', 'a:nx-release-publish', '--access=public', '--firstRelease'],
      { stdio: 'inherit', cwd: root },
    );
    expect(exec).toHaveBeenCalledWith(
      'npm',
      ['trust', 'github', '@scope/a', '--file=publish.yml', '--repo=owner/repo', '--allow-publish', '--yes'],
      { stdio: 'inherit', cwd: root },
    );
    expect(exec).not.toHaveBeenCalledWith('npx', expect.arrayContaining(['b:nx-release-publish']), expect.anything());
  });

  it('only prints the commands in dry-run mode', async () => {
    const result = await bootstrapNpmPackagesExecutor(
      { dryRun: true, repository: 'org/name', workflow: 'release.yml' },
      context,
    );

    expect(result).toEqual({ success: true });
    expect(logger.info).toHaveBeenCalledWith('Bootstrapping @scope/a (a)');
    expect(logger.info).toHaveBeenCalledWith(
      '[dry-run] npx nx run a:nx-release-publish --access=public --firstRelease',
    );
    expect(logger.info).toHaveBeenCalledWith(
      '[dry-run] npm trust github @scope/a --file=release.yml --repo=org/name --allow-publish --yes',
    );
    expect(exec).not.toHaveBeenCalledWith('npx', expect.anything(), expect.anything());
    expect(exec).not.toHaveBeenCalledWith('git', expect.anything(), expect.anything());
  });

  it('does nothing when every package exists', async () => {
    published.add('@scope/a');

    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: true });
    expect(logger.info).toHaveBeenCalledWith('All release packages already exist on npm.');
  });

  it('fails when the repository cannot be determined', async () => {
    exec.mockImplementation(() => 'https://gitlab.com/owner/repo.git');

    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Pass --repository.'));
  });

  it('fails when git is unavailable', async () => {
    exec.mockImplementation(() => {
      throw new Error('git missing');
    });

    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith('git missing');
  });

  it.each([
    ['https://github.com/owner/repo.git', 'owner/repo'],
    ['https://github.com/owner/repo', 'owner/repo'],
    ['git@github.com:owner/repo.git', 'owner/repo'],
  ])('parses %s', (url, repository) => {
    exec.mockReturnValue(url);

    expect(getGitHubRepository(root)).toBe(repository);
  });

  it('handles an empty command output', () => {
    exec.mockReturnValue(null as unknown as string);

    expect(() => getGitHubRepository(root)).toThrow('Unable to determine the GitHub repository');
  });
});
