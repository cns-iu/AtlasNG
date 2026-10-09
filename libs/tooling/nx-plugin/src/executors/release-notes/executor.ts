import { type ExecutorContext, logger, type NxJsonConfiguration, type ProjectGraphProjectNode } from '@nx/devkit';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { findMatchingProjects } from 'nx/src/devkit-internals';

/** Options for the `release-notes` executor. */
export interface ReleaseNotesExecutorOptions {
  /** Name of the release group in `nx.json`. Defaults to `libraries`. */
  group?: string;
  /** The release tag, for example `v1.2.3`. The version is extracted using the group's release tag pattern. */
  tag: string;
  /** File to write the notes to, relative to the workspace root. The notes are printed to stdout when omitted. */
  output?: string;
}

/** A release group from `nx.json`. */
type ReleaseGroupConfig = NonNullable<NonNullable<NxJsonConfiguration['release']>['groups']>[string];

/** Notes used when no library has changes beyond a version bump. */
const VERSION_BUMP_ONLY_NOTES = 'This was a version bump only, there were no code changes.\n';

/** Detects changelog sections that `nx release` generates for unchanged projects. */
const VERSION_BUMP_ONLY_PATTERN = /^This was a version bump only/m;

/**
 * Builds combined GitHub release notes for a fixed release group from each project's `CHANGELOG.md`.
 * Projects whose section only records a version bump are left out.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns Whether the notes were produced.
 */
export default async function releaseNotesExecutor(
  options: ReleaseNotesExecutorOptions,
  context: ExecutorContext,
): Promise<{ success: boolean }> {
  try {
    const notes = await buildReleaseNotes(options, context);
    if (options.output) {
      const outputPath = resolve(context.root, options.output);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, notes, 'utf8');
      logger.info(`Wrote release notes for ${options.tag} to ${options.output}`);
    } else {
      process.stdout.write(notes);
    }

    return { success: true };
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return { success: false };
  }
}

/**
 * Collects the release notes for every project in the release group.
 *
 * @param options The executor options.
 * @param context The Nx executor context.
 * @returns The release notes as Markdown, ending with a newline.
 * @throws When the release group does not exist or a project cannot be found.
 */
export async function buildReleaseNotes(
  options: ReleaseNotesExecutorOptions,
  context: ExecutorContext,
): Promise<string> {
  const groupName = options.group ?? 'libraries';
  const group = getReleaseGroup(context.nxJsonConfiguration, groupName);
  const version = extractVersion(options.tag, getReleaseTagPattern(context.nxJsonConfiguration, group), groupName);
  const notes: string[] = [];

  for (const project of resolveGroupProjects(group, context)) {
    const root = join(context.root, project.data.root);
    const { name } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as { name: string };
    const changelog = await readFile(join(root, 'CHANGELOG.md'), 'utf8').catch(() => '');
    const section = extractVersionSection(changelog, version);
    if (section && !VERSION_BUMP_ONLY_PATTERN.test(section)) {
      notes.push(`## ${name}\n\n${section.replace(/^### /gm, '#### ')}`);
    }
  }

  return notes.length > 0 ? notes.join('\n\n') + '\n' : VERSION_BUMP_ONLY_NOTES;
}

/**
 * Reads a release group from `nx.json`.
 *
 * @param nxJson The workspace `nx.json`.
 * @param groupName The release group name.
 * @returns The release group configuration.
 * @throws When the group is not configured.
 */
function getReleaseGroup(nxJson: NxJsonConfiguration | undefined, groupName: string): ReleaseGroupConfig {
  const group = nxJson?.release?.groups?.[groupName];
  if (!group) {
    throw new Error(`Release group "${groupName}" is not configured in nx.json`);
  }

  return group;
}

/**
 * Determines the release tag pattern for a group, falling back to the workspace pattern and the Nx default.
 *
 * @param nxJson The workspace `nx.json`.
 * @param group The release group configuration.
 * @returns The release tag pattern.
 */
function getReleaseTagPattern(nxJson: NxJsonConfiguration | undefined, group: ReleaseGroupConfig): string {
  return group.releaseTag?.pattern ?? nxJson?.release?.releaseTag?.pattern ?? 'v{version}';
}

/**
 * Extracts the version from a release tag using the group's tag pattern.
 * Falls back to stripping a leading `v` when the tag does not match the pattern.
 *
 * @param tag The release tag.
 * @param pattern The release tag pattern, for example `v{version}`.
 * @param groupName The release group name, substituted for `{releaseGroupName}`.
 * @returns The version without any prefix.
 */
export function extractVersion(tag: string, pattern: string, groupName: string): string {
  const source = pattern
    .split(/(\{version\}|\{projectName\}|\{releaseGroupName\})/)
    .map((part) => {
      switch (part) {
        case '{version}':
          return '(?<version>.+)';
        case '{projectName}':
          return '.+';
        case '{releaseGroupName}':
          return escapeRegExp(groupName);
        default:
          return escapeRegExp(part);
      }
    })
    .join('');

  return new RegExp(`^${source}$`).exec(tag)?.groups?.['version'] ?? tag.replace(/^v/, '');
}

/**
 * Escapes characters that have a special meaning in regular expressions.
 *
 * @param value The literal text.
 * @returns The escaped text.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolves the group's project specifiers against the project graph, keeping the order of `nx.json`.
 * Projects matched by a single glob, directory or tag specifier are sorted by name.
 *
 * @param group The release group configuration.
 * @param context The Nx executor context.
 * @returns The project graph nodes of the group.
 * @throws When a specifier matches no project.
 */
function resolveGroupProjects(group: ReleaseGroupConfig, context: ExecutorContext): ProjectGraphProjectNode[] {
  const nodes = context.projectGraph.nodes;
  const specifiers = Array.isArray(group.projects) ? group.projects : [group.projects];
  const names = new Set<string>();

  for (const specifier of specifiers) {
    const matches = findMatchingProjects([specifier], nodes);
    if (matches.length === 0) {
      throw new Error(`Unable to find the release project "${specifier}"`);
    }

    matches.sort((a, b) => a.localeCompare(b)).forEach((name) => names.add(name));
  }

  return [...names].map((name) => nodes[name] as ProjectGraphProjectNode);
}

/**
 * Extracts the body of a version's section from a changelog generated by `nx release`.
 *
 * @param changelog The changelog contents.
 * @param version The version whose section is extracted, without a `v` prefix.
 * @returns The section body without its heading, or `undefined` if the version is missing.
 */
export function extractVersionSection(changelog: string, version: string): string | undefined {
  const sections = changelog.split(/^(?=## )/m);
  const section = sections.find((candidate) => candidate.startsWith(`## ${version} `));
  return section?.slice(section.indexOf('\n') + 1).trim();
}
