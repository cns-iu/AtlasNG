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

  const node = (name: string, projectRoot: string, publish = true, packageRoot?: string): ProjectGraphProjectNode => ({
    name,
    type: 'lib',
    data: {
      root: projectRoot,
      targets: publish ? { 'nx-release-publish': packageRoot ? { options: { packageRoot } } : {} } : {},
    },
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
          a: node('a', 'libs/a', true, '{workspaceRoot}/dist/{projectRoot}'),
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
          throw Object.assign(new Error('Command failed: npm view'), { stderr: 'npm error code E404\n' });
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
      { project: 'a', packageName: '@scope/a', packageRoot: 'dist/libs/a' },
      { project: 'b', packageName: '@scope/b', packageRoot: 'libs/b' },
    ]);
  });

  it('lists dependencies before their dependents', async () => {
    context.projectGraph.dependencies = {
      a: [
        { source: 'a', target: 'b', type: 'static' },
        { source: 'a', target: 'app', type: 'static' },
      ],
      b: [{ source: 'b', target: 'a', type: 'static' }],
    };

    expect((await getReleasePackages(context)).map(({ project }) => project)).toEqual(['b', 'a']);
  });

  it('publishes and trusts packages missing from npm', async () => {
    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: true });
    expect(exec).toHaveBeenCalledWith('npx', ['nx', 'run-many', '-t', 'build', '--projects=a'], {
      stdio: 'inherit',
      cwd: root,
    });
    expect(exec).toHaveBeenCalledWith('npm', ['publish', 'dist/libs/a', '--access=public'], {
      stdio: 'inherit',
      cwd: root,
    });
    expect(exec).toHaveBeenCalledWith(
      'npm',
      ['trust', 'github', '@scope/a', '--file=publish.yml', '--repo=owner/repo', '--allow-publish', '--yes'],
      { stdio: 'inherit', cwd: root },
    );
    expect(exec).not.toHaveBeenCalledWith('npm', expect.arrayContaining(['libs/b']), expect.anything());
  });

  it('fails without publishing when npm cannot tell whether a package exists', async () => {
    exec.mockImplementation((command) => {
      if (command === 'npm') {
        throw Object.assign(new Error('Command failed: npm view'), { stderr: 'npm error code ETIMEDOUT\n' });
      }
      return 'git@github.com:owner/repo.git';
    });

    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith(
      'Unable to check whether @scope/a exists on npm: npm error code ETIMEDOUT',
    );
    expect(exec).not.toHaveBeenCalledWith('npx', expect.anything(), expect.anything());
  });

  it('reports the npm error message when npm prints nothing', async () => {
    exec.mockImplementation((command) => {
      if (command === 'npm') {
        throw new Error('spawn npm ENOENT');
      }
      return 'git@github.com:owner/repo.git';
    });

    const result = await bootstrapNpmPackagesExecutor({ repository: 'owner/repo' }, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith('Unable to check whether @scope/a exists on npm: spawn npm ENOENT');
  });

  it('keeps going and reports the commands to run when npm trust fails', async () => {
    published.clear();
    const view = exec.getMockImplementation();
    exec.mockImplementation((command, args, options) => {
      const argv = args as string[];
      if (command === 'npm' && argv[0] === 'trust' && argv[2] === '@scope/a') {
        throw new Error('npm trust failed');
      }
      return view?.(command, args, options) ?? '';
    });

    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: false });
    expect(exec).toHaveBeenCalledWith('npm', ['publish', 'libs/b', '--access=public'], {
      stdio: 'inherit',
      cwd: root,
    });
    expect(exec).toHaveBeenCalledWith('npm', expect.arrayContaining(['trust', '@scope/b']), expect.anything());
    expect(logger.error).toHaveBeenCalledWith('npm trust failed for @scope/a: npm trust failed');
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(
        '\n  npm trust github @scope/a --file=publish.yml --repo=owner/repo --allow-publish --yes',
      ),
    );
    expect(logger.error).not.toHaveBeenCalledWith(expect.stringContaining('github @scope/b'));
  });

  it('stops when npm publish fails', async () => {
    published.clear();
    const view = exec.getMockImplementation();
    exec.mockImplementation((command, args, options) => {
      if (command === 'npm' && (args as string[])[0] === 'publish') {
        throw new Error('npm publish failed');
      }
      return view?.(command, args, options) ?? '';
    });

    const result = await bootstrapNpmPackagesExecutor({}, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith('npm publish failed');
    expect(exec).not.toHaveBeenCalledWith('npm', expect.arrayContaining(['trust']), expect.anything());
  });

  describe('on Windows', () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform') as PropertyDescriptor;

    beforeEach(() => {
      Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
    });

    afterEach(() => {
      Object.defineProperty(process, 'platform', platform);
    });

    it('runs npm and npx through the shell with quoted arguments', async () => {
      exec.mockImplementation((command) => {
        if (String(command).startsWith('npm view @scope/b')) {
          return '@scope/b';
        }
        if (String(command).startsWith('npm view')) {
          throw Object.assign(new Error('Command failed'), { stdout: '{"error":{"code":"E404"}}' });
        }
        return '';
      });

      const result = await bootstrapNpmPackagesExecutor(
        { repository: 'owner/repo', workflow: 'my publish.yml' },
        context,
      );

      expect(result).toEqual({ success: true });
      expect(exec).toHaveBeenCalledWith('npm view @scope/a name', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });
      expect(exec).toHaveBeenCalledWith('npx nx run-many -t build --projects=a', {
        stdio: 'inherit',
        cwd: root,
        shell: true,
      });
      expect(exec).toHaveBeenCalledWith(
        'npm trust github @scope/a "--file=my publish.yml" --repo=owner/repo --allow-publish --yes',
        { stdio: 'inherit', cwd: root, shell: true },
      );
    });
  });

  it('only prints the commands in dry-run mode', async () => {
    const result = await bootstrapNpmPackagesExecutor(
      { dryRun: true, repository: 'org/name', workflow: 'release.yml' },
      context,
    );

    expect(result).toEqual({ success: true });
    expect(logger.info).toHaveBeenCalledWith('Bootstrapping @scope/a (a)');
    expect(logger.info).toHaveBeenCalledWith('[dry-run] npx nx run-many -t build --projects=a');
    expect(logger.info).toHaveBeenCalledWith('[dry-run] npm publish dist/libs/a --access=public');
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
