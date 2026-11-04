import { type ExecutorContext, logger } from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pageLastModifiedExecutor, { collectPageLastModifiedDates } from './executor.ts';

describe('page-last-modified executor', () => {
  let root: string;

  const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    });

  const commit = (date: string, files: Record<string, string>) => {
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), content);
      git('add', path);
    }
    execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', date], {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: `${date}T12:00:00Z`, GIT_COMMITTER_DATE: `${date}T12:00:00Z` },
      stdio: 'pipe',
    });
  };

  const context = () => ({ root, cwd: root, isVerbose: false }) as unknown as ExecutorContext;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'page-last-modified-'));
    git('init', '-q');
    vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('dates each page by the last commit that changed its source file', () => {
    commit('2026-01-01', { 'content/about.yaml': 'v1', 'content/team.yaml': 'v1' });
    commit('2026-02-01', { 'content/about.yaml': 'v2', 'src/layout.ts': 'changed' });

    const dates = collectPageLastModifiedDates(
      [
        { route: '/about', source: 'content/about.yaml' },
        { route: 'team/', source: 'content/team.yaml' },
      ],
      root,
    );

    expect(dates).toEqual({ '/about': '2026-02-01', '/team': '2026-01-01' });
  });

  it('creates one route per file for a :param route', () => {
    commit('2026-01-01', { 'datasets/heart.json': '{}', 'datasets/liver.json': '{}' });
    commit('2026-03-15', { 'datasets/liver.json': '{"v":2}' });

    const dates = collectPageLastModifiedDates([{ route: '/dataset/:datasetId', source: 'datasets/*.json' }], root);

    expect(dates).toEqual({ '/dataset/heart': '2026-01-01', '/dataset/liver': '2026-03-15' });
  });

  it('uses the latest date when a route without a :param matches several files', () => {
    commit('2026-01-01', { 'content/home/intro.yaml': 'v1' });
    commit('2026-04-01', { 'content/home/news.yaml': 'v1' });

    const dates = collectPageLastModifiedDates([{ route: '/', source: 'content/home/*.yaml' }], root);

    expect(dates).toEqual({ '/': '2026-04-01' });
  });

  it('leaves out untracked and uncommitted files with a warning', () => {
    commit('2026-01-01', { 'datasets/heart.json': '{}' });
    writeFileSync(join(root, 'datasets/untracked.json'), '{}');
    writeFileSync(join(root, 'datasets/staged.json'), '{}');
    git('add', 'datasets/staged.json');

    const dates = collectPageLastModifiedDates([{ route: '/dataset/:id', source: 'datasets/*.json' }], root);

    expect(dates).toEqual({ '/dataset/heart': '2026-01-01' });
    expect(logger.warn).toHaveBeenCalledWith('datasets/staged.json has no commits yet; it is left out.');
  });

  it('warns when no tracked files match a source', () => {
    commit('2026-01-01', { 'content/about.yaml': 'v1' });

    expect(collectPageLastModifiedDates([{ route: '/missing', source: 'content/missing.yaml' }], root)).toEqual({});
    expect(logger.warn).toHaveBeenCalledWith('No files tracked by Git match content/missing.yaml for route /missing.');
  });

  it('warns when a route is configured more than once and keeps the latest date', () => {
    commit('2026-01-01', { 'a.yaml': 'v1' });
    commit('2026-02-01', { 'b.yaml': 'v1' });

    const dates = collectPageLastModifiedDates(
      [
        { route: '/page', source: 'b.yaml' },
        { route: '/page', source: 'a.yaml' },
      ],
      root,
    );

    expect(dates).toEqual({ '/page': '2026-02-01' });
    expect(logger.warn).toHaveBeenCalledWith('Route /page is configured more than once; using its latest date.');
  });

  it('warns when the repository is a shallow clone', () => {
    commit('2026-01-01', { 'a.yaml': 'v1' });
    commit('2026-02-01', { 'a.yaml': 'v2' });
    const source = root;
    root = mkdtempSync(join(tmpdir(), 'page-last-modified-shallow-'));
    execFileSync('git', ['clone', '-q', '--depth=1', `file://${source}`, root], { stdio: 'pipe' });
    rmSync(source, { recursive: true, force: true });

    collectPageLastModifiedDates([{ route: '/a', source: 'a.yaml' }], root);

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('shallow clone'));
  });

  it('rejects routes with more than one :param segment', () => {
    expect(() => collectPageLastModifiedDates([{ route: '/:a/:b', source: '*.json' }], root)).toThrow(
      'Route /:a/:b has more than one :param segment; only one is supported.',
    );
  });

  it('rejects :param routes whose source is not a glob', () => {
    commit('2026-01-01', { 'a.json': '{}' });

    expect(() => collectPageLastModifiedDates([{ route: '/dataset/:id', source: 'a.json' }], root)).toThrow(
      'Route /dataset/:id has a :param segment, so its source must be a glob, but got a.json.',
    );
  });

  it('writes the dates as sorted JSON', async () => {
    commit('2026-01-01', { 'content/b.yaml': 'v1', 'content/a.yaml': 'v1' });

    const result = await pageLastModifiedExecutor(
      { pages: [{ route: '/:page', source: 'content/*.yaml' }], outputFile: 'public/page-last-modified.json' },
      context(),
    );

    expect(result).toEqual({ success: true });
    expect(readFileSync(join(root, 'public/page-last-modified.json'), 'utf8')).toBe(
      '{\n  "/a": "2026-01-01",\n  "/b": "2026-01-01"\n}\n',
    );
    expect(logger.info).toHaveBeenCalledWith('Wrote last modified dates for 2 pages to public/page-last-modified.json');
  });

  it('fails outside a Git repository', async () => {
    rmSync(join(root, '.git'), { recursive: true, force: true });

    const result = await pageLastModifiedExecutor({ pages: [], outputFile: 'out.json' }, context());

    expect(result).toEqual({ success: false });
    expect(logger.error).toHaveBeenCalled();
  });
});
