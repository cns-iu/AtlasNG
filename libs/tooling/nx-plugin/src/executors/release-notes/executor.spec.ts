import { type ExecutorContext, logger, type NxJsonConfiguration, type ProjectGraphProjectNode } from '@nx/devkit';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import releaseNotesExecutor, { buildReleaseNotes, extractVersion, extractVersionSection } from './executor.ts';

const CDK_CHANGELOG = `## 1.1.0 (2026-01-02)

### 🚀 Features

- add things

### ❤️ Thank You

- Someone

## 1.0.0 (2026-01-01)

### 🩹 Fixes

- old fix
`;

const CORE_CHANGELOG = `## 1.1.0 (2026-01-02)

This was a version bump only for core to align it with other projects, there were no code changes.
`;

describe('release-notes executor', () => {
  let root: string;
  let context: ExecutorContext;

  const node = (name: string, projectRoot: string): ProjectGraphProjectNode => ({
    name,
    type: 'lib',
    data: { root: projectRoot, tags: name === 'core' ? ['scope:core'] : [] },
  });

  const write = (path: string, content: string) => {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), content);
  };

  const createContext = (release: NxJsonConfiguration['release']): ExecutorContext =>
    ({
      root,
      cwd: root,
      isVerbose: false,
      nxJsonConfiguration: { release },
      projectGraph: {
        nodes: { cdk: node('cdk', 'libs/cdk'), core: node('core', 'libs/core'), docs: node('docs', 'libs/docs') },
        dependencies: {},
      },
      projectsConfigurations: { version: 2, projects: {} },
    }) as unknown as ExecutorContext;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'release-notes-'));
    write('libs/cdk/package.json', JSON.stringify({ name: '@scope/cdk' }));
    write('libs/cdk/CHANGELOG.md', CDK_CHANGELOG);
    write('libs/core/package.json', JSON.stringify({ name: '@scope/core' }));
    write('libs/core/CHANGELOG.md', CORE_CHANGELOG);
    write('libs/docs/package.json', JSON.stringify({ name: '@scope/docs' }));
    context = createContext({
      groups: { libraries: { projects: ['core', 'cdk', 'docs'], releaseTag: { pattern: 'v{version}' } } },
    });
    vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('combines the changelog sections of changed projects', async () => {
    const notes = await buildReleaseNotes({ tag: 'v1.1.0' }, context);

    expect(notes).toBe('## @scope/cdk\n\n#### 🚀 Features\n\n- add things\n\n#### ❤️ Thank You\n\n- Someone\n');
  });

  it('reports a version bump when no project changed', async () => {
    const notes = await buildReleaseNotes({ tag: 'v2.0.0' }, context);

    expect(notes).toBe('This was a version bump only, there were no code changes.\n');
  });

  it('resolves glob, directory and tag specifiers', async () => {
    context = createContext({ groups: { libs: { projects: ['libs/*', 'tag:scope:core'] } } });

    const notes = await buildReleaseNotes({ group: 'libs', tag: 'v1.0.0' }, context);

    expect(notes).toBe('## @scope/cdk\n\n#### 🩹 Fixes\n\n- old fix\n');
  });

  it('writes the notes to the output file', async () => {
    const result = await releaseNotesExecutor({ tag: 'v1.1.0', output: 'tmp/notes/release.md' }, context);

    expect(result).toEqual({ success: true });
    expect(readFileSync(join(root, 'tmp/notes/release.md'), 'utf8')).toContain('## @scope/cdk');
    expect(logger.info).toHaveBeenCalledWith('Wrote release notes for v1.1.0 to tmp/notes/release.md');
  });

  it('prints the notes to stdout without an output file', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const result = await releaseNotesExecutor({ tag: 'v2.0.0' }, context);

    expect(result).toEqual({ success: true });
    expect(stdout).toHaveBeenCalledWith('This was a version bump only, there were no code changes.\n');
  });

  it('fails for an unknown group', async () => {
    const result = await releaseNotesExecutor({ group: 'missing', tag: 'v1.0.0' }, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith('Release group "missing" is not configured in nx.json');
  });

  it('fails when a project specifier matches nothing', async () => {
    context = createContext({ groups: { libraries: { projects: ['unknown'] } } });

    const result = await releaseNotesExecutor({ tag: 'v1.0.0' }, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith('Unable to find the release project "unknown"');
  });

  it('fails without a release configuration', async () => {
    context = { ...context, nxJsonConfiguration: undefined } as unknown as ExecutorContext;

    const result = await releaseNotesExecutor({ tag: 'v1.0.0' }, context);

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalledWith('Release group "libraries" is not configured in nx.json');
  });

  describe('extractVersion', () => {
    it.each([
      ['v1.2.3', 'v{version}', '1.2.3'],
      ['cdk@1.2.3', '{projectName}@{version}', '1.2.3'],
      ['libraries-1.2.3', '{releaseGroupName}-{version}', '1.2.3'],
      ['v1.2.3', 'release/{version}', '1.2.3'],
      ['1.2.3', 'release/{version}', '1.2.3'],
    ])('extracts the version from %s with %s', (tag, pattern, version) => {
      expect(extractVersion(tag, pattern, 'libraries')).toBe(version);
    });

    it('falls back to the workspace and default tag patterns', async () => {
      context = createContext({ releaseTag: { pattern: 'r{version}' }, groups: { libraries: { projects: 'cdk' } } });

      expect(await buildReleaseNotes({ tag: 'r1.0.0' }, context)).toContain('old fix');

      context = createContext({ groups: { libraries: { projects: ['cdk'] } } });

      expect(await buildReleaseNotes({ tag: 'v1.0.0' }, context)).toContain('old fix');
    });
  });

  describe('extractVersionSection', () => {
    it('returns undefined for a missing version', () => {
      expect(extractVersionSection(CDK_CHANGELOG, '9.9.9')).toBeUndefined();
    });
  });
});
