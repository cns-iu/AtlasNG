import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ChangelogChange } from 'nx/release/changelog-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MailmapChangelogRenderer, { canonicalizeAuthors, createMailmapResolver } from './index.ts';

const LIBBY = { name: 'Elizabeth Maier', email: '97060856+LibbyUX@users.noreply.github.com' };

describe('changelog renderer', () => {
  let root: string;

  const change = (authors: ChangelogChange['authors'], description = 'add things'): ChangelogChange => ({
    type: 'feat',
    scope: '',
    description,
    affectedProjects: '*',
    authors,
  });

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'changelog-renderer-'));
    execFileSync('git', ['init', '-q'], { cwd: root });
    writeFileSync(
      join(root, '.mailmap'),
      [
        `${LIBBY.name} <${LIBBY.email}> <${LIBBY.email}>`,
        `${LIBBY.name} <${LIBBY.email}> <ecmaier@iu.edu>`,
        '',
      ].join('\n'),
    );
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('createMailmapResolver', () => {
    it('resolves authors to their canonical identities', () => {
      const resolve = createMailmapResolver(
        [change([{ name: 'LibbyUX', email: LIBBY.email }]), change([{ name: 'Libby', email: 'ecmaier@iu.edu' }])],
        root,
      );

      expect(resolve({ name: 'LibbyUX', email: LIBBY.email })).toEqual(LIBBY);
      expect(resolve({ name: 'Libby', email: 'ecmaier@iu.edu' })).toEqual(LIBBY);
    });

    it('keeps authors that the mailmap does not list', () => {
      const author = { name: 'Edward Lu', email: '36934022+edlu77@users.noreply.github.com' };
      const resolve = createMailmapResolver([change([author])], root);

      expect(resolve(author)).toEqual(author);
    });

    it('keeps authors as parsed when git cannot read the mailmap', () => {
      const author = { name: 'LibbyUX', email: LIBBY.email };
      const resolve = createMailmapResolver([change([author])], join(root, 'missing'));

      expect(resolve(author)).toEqual(author);
    });

    it('skips authors without an email', () => {
      const author = { name: 'Unknown', email: '' };
      const resolve = createMailmapResolver([change([author]), change(undefined)], root);

      expect(resolve(author)).toEqual(author);
    });
  });

  describe('canonicalizeAuthors', () => {
    it('removes duplicates and AI coding assistants', () => {
      const authors = canonicalizeAuthors(
        [
          { name: 'LibbyUX', email: LIBBY.email },
          { name: 'Claude Opus 5.5', email: 'noreply@anthropic.com' },
          { name: 'Copilot', email: 'copilot@github.com' },
          { name: 'Copilot', email: '175728472+Copilot@users.noreply.github.com' },
          { name: 'Libby', email: 'ecmaier@iu.edu' },
        ],
        () => LIBBY,
      );

      expect(authors).toEqual([LIBBY]);
    });
  });

  describe('MailmapChangelogRenderer', () => {
    class TestRenderer extends MailmapChangelogRenderer {
      protected override readonly mailmapRoot = root;
    }

    const render = async (changes: ChangelogChange[], applyUsernameToAuthors = vi.fn()) =>
      new TestRenderer({
        changes,
        changelogEntryVersion: '1.0.0',
        project: null,
        entryWhenNoChanges: false,
        isVersionPlans: false,
        changelogRenderOptions: { authors: true, applyUsernameToAuthors: true, commitReferences: false },
        conventionalCommitsConfig: {
          types: { feat: { semverBump: 'minor', changelog: { title: 'Features', hidden: false } } },
        },
        remoteReleaseClient: {
          getRemoteRepoData: () => ({ hostname: 'github.com', slug: 'cns-iu/AtlasNG', apiBaseUrl: '' }),
          remoteReleaseProviderName: 'GitHub',
          applyUsernameToAuthors,
        },
      } as unknown as ConstructorParameters<typeof MailmapChangelogRenderer>[0]).render();

    it('thanks each person once and leaves out AI co-authors', async () => {
      const applyUsernameToAuthors = vi.fn(async (authors: Map<string, { email: Set<string>; username?: string }>) => {
        for (const meta of authors.values()) {
          meta.username = 'LibbyUX';
        }
      });

      const notes = await render(
        [
          change([
            { name: 'LibbyUX', email: LIBBY.email },
            { name: 'Claude Opus 5.5', email: 'noreply@anthropic.com' },
          ]),
          change([{ name: 'Libby', email: 'ecmaier@iu.edu' }], 'add more things'),
          change(undefined, 'add anonymous things'),
        ],
        applyUsernameToAuthors,
      );

      expect(applyUsernameToAuthors).toHaveBeenCalledWith(
        new Map([[LIBBY.name, { email: new Set([LIBBY.email]), username: 'LibbyUX' }]]),
      );
      expect(notes).toContain('### ❤️ Thank You\n\n- Elizabeth Maier @LibbyUX');
      expect(notes).not.toContain('Claude');
      expect(notes).not.toContain('- Libby\n');
    });
  });
});
