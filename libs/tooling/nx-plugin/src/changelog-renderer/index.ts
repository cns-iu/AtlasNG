import { workspaceRoot } from '@nx/devkit';
import { execFileSync } from 'node:child_process';
import nxChangelogRenderer, { type ChangelogChange } from 'nx/release/changelog-renderer';

/**
 * Nx's default changelog renderer. Node exposes its CommonJS module object as the default import,
 * with the class under `default`, while Vite unwraps that `default` export.
 */
const DefaultChangelogRenderer = ((nxChangelogRenderer as Partial<typeof nxChangelogRenderer>).default ??
  nxChangelogRenderer) as typeof nxChangelogRenderer.default;

/** A commit author or co-author as Nx parses it from git. */
type ChangelogAuthor = NonNullable<ChangelogChange['authors']>[number];

/**
 * Emails of AI coding assistants that appear as commit authors or `Co-authored-by` trailers.
 * Nx already skips GitHub App accounts whose names end in `[bot]`.
 */
const AI_AUTHOR_EMAIL_PATTERN = /^(?:noreply@anthropic\.com|copilot@github\.com|(?:\d+\+)?copilot@users\.noreply\.github\.com)$/i;

/** Parses a `Name <email>` contact as printed by `git check-mailmap`. */
const CONTACT_PATTERN = /^(?<name>.*?)\s*<(?<email>[^>]*)>$/;

/**
 * Changelog renderer that resolves authors through the repository's `.mailmap` and leaves AI
 * coding assistants out of the "Thank You" section.
 *
 * Nx reads raw commit authors, so one person who commits under several names or emails is listed
 * more than once, and anyone without a GitHub noreply email or a public email loses their
 * `@username`. Mapping every identity to a single name and GitHub noreply email in `.mailmap`
 * fixes both. Use it with `release.changelog.*.renderer` in `nx.json`, for example
 * `"renderer": "@atlasng/nx-plugin/changelog-renderer"`.
 */
export default class MailmapChangelogRenderer extends DefaultChangelogRenderer {
  /** The repository whose `.mailmap` resolves authors. */
  protected readonly mailmapRoot: string = workspaceRoot;

  /** Applies the default preprocessing, then canonicalizes the authors of every change. */
  protected override preprocessChanges(): void {
    super.preprocessChanges();

    const resolve = createMailmapResolver(
      [...this.relevantChanges, ...this.additionalChangesForAuthorsSection],
      this.mailmapRoot,
    );
    const withCanonicalAuthors = (change: ChangelogChange): ChangelogChange =>
      change.authors ? { ...change, authors: canonicalizeAuthors(change.authors, resolve) } : change;

    this.relevantChanges = this.relevantChanges.map(withCanonicalAuthors);
    this.additionalChangesForAuthorsSection = this.additionalChangesForAuthorsSection.map(withCanonicalAuthors);
  }
}

/**
 * Maps authors to their canonical identities and drops AI coding assistants.
 *
 * @param authors The authors of one change.
 * @param resolve Returns the canonical identity of an author.
 * @returns The canonical, human authors without duplicates.
 */
export function canonicalizeAuthors(
  authors: ChangelogAuthor[],
  resolve: (author: ChangelogAuthor) => ChangelogAuthor,
): ChangelogAuthor[] {
  const unique = new Map<string, ChangelogAuthor>();
  for (const author of authors.map(resolve)) {
    if (!AI_AUTHOR_EMAIL_PATTERN.test(author.email)) {
      unique.set(`${author.name}\0${author.email}`, author);
    }
  }

  return [...unique.values()];
}

/**
 * Looks up the canonical identity of every author of the given changes with one
 * `git check-mailmap` call.
 *
 * @param changes The changes whose authors are resolved.
 * @param cwd The repository to read `.mailmap` from. Defaults to the workspace root.
 * @returns A function that returns an author's canonical identity, or the author itself when git
 * cannot resolve it.
 */
export function createMailmapResolver(
  changes: ChangelogChange[],
  cwd = workspaceRoot,
): (author: ChangelogAuthor) => ChangelogAuthor {
  const contacts = [
    ...new Set(
      changes.flatMap((change) => (change.authors ?? []).filter((author) => author.email).map(formatContact)),
    ),
  ];
  const canonical = new Map<string, ChangelogAuthor>();
  if (contacts.length > 0) {
    try {
      const output = execFileSync('git', ['check-mailmap', '--stdin'], {
        cwd,
        encoding: 'utf8',
        input: `${contacts.join('\n')}\n`,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      output
        .split('\n')
        .slice(0, contacts.length)
        .forEach((line, index) => {
          const match = CONTACT_PATTERN.exec(line.trim());
          if (match?.groups) {
            canonical.set(contacts[index], { name: match.groups['name'], email: match.groups['email'] });
          }
        });
    } catch {
      // Without git the authors are rendered as Nx parsed them.
    }
  }

  return (author) => canonical.get(formatContact(author)) ?? author;
}

/**
 * Formats an author as a `Name <email>` contact for `git check-mailmap`.
 *
 * @param author The author to format.
 * @returns The contact.
 */
function formatContact(author: ChangelogAuthor): string {
  return `${author.name.trim()} <${author.email.trim()}>`;
}
