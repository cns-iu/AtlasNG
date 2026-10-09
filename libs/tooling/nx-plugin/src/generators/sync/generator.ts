import { formatFiles, getProjects, joinPathFragments, readJson, readNxJson, type Tree, writeJson } from '@nx/devkit';
import type { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { PREFIXED_GENERATORS, readPrefix } from '../../utils/prefix.ts';
import { isJsonObject, type JsonObject, mergeShared } from './merge.ts';

/** Options for the `sync` generator, read from `nx.json` `sync.generatorOptions['@atlasng/nx-plugin:sync']`. */
export interface SyncGeneratorSchema {
  /** Angular selector prefix used in the managed files. Defaults to the `nx.json` generator prefix, or `app`. */
  prefix?: string;
  /** Managed-file ids or paths to leave alone. A directory path also skips the files below it. */
  exclude?: string[];
  /** Commit scopes added to the Nx project names in `.vscode/settings.json`, for example `release`. */
  extraScopes?: string[];
  /** Do not format the changed files. Used by `init`, which formats everything at the end. */
  skipFormat?: boolean;
}

/** Specifier under which the generator is registered in `nx.json` `sync.globalGenerators`. */
export const SYNC_GENERATOR = '@atlasng/nx-plugin:sync';

/** Marker that opens the managed section of `AGENTS.md`. */
export const AGENTS_START = '<!-- atlasng configuration start -->';

/** Marker that closes the managed section of `AGENTS.md`. */
export const AGENTS_END = '<!-- atlasng configuration end -->';

/** Note written below {@link AGENTS_START}. */
const AGENTS_NOTE = '<!-- Leave the start & end comments to automatically receive updates. -->';

/** Directory that holds the managed file templates. */
const FILES_DIR = fileURLToPath(new URL('./files/', import.meta.url));

/** The `nx.json` preset shipped with the plugin. */
const NX_PRESET_PATH = fileURLToPath(new URL('../../../presets/nx.json', import.meta.url));

/** Top-level `nx.json` keys copied from the preset. */
const NX_PRESET_KEYS = ['namedInputs', 'targetDefaults', 'generators'] as const;

/** Directory of the team skills in a workspace. */
const SKILLS_DIR = '.agents/skills';

/** Name prefix of the team skills. Other skills in {@link SKILLS_DIR}, such as the Nx ones, are never touched. */
const SKILL_PREFIX = 'atlasng-';

/** A file that is replaced as a whole by its template. */
interface WholeFile {
  /** Id used in the `exclude` option. */
  id: string;
  /** Path in the workspace. */
  path: string;
  /** Template path, relative to {@link FILES_DIR}. */
  template: string;
  /** Whether the file must be executable. */
  executable?: boolean;
}

/** A JSON file whose template values are merged into the workspace copy with {@link mergeShared}. */
interface JsonFile {
  /** Id used in the `exclude` option. */
  id: string;
  /** Path in the workspace. */
  path: string;
  /** Template path, relative to {@link FILES_DIR}. */
  template: string;
}

/** Files replaced as a whole. */
export const WHOLE_FILES: readonly WholeFile[] = [
  { id: 'editorconfig', path: '.editorconfig', template: 'editorconfig' },
  { id: 'gitattributes', path: '.gitattributes', template: 'gitattributes' },
  { id: 'nvmrc', path: '.nvmrc', template: 'nvmrc' },
  { id: 'husky-commit-msg', path: '.husky/commit-msg', template: 'husky/commit-msg', executable: true },
  { id: 'husky-pre-commit', path: '.husky/pre-commit', template: 'husky/pre-commit', executable: true },
  {
    id: 'testing-instructions',
    path: '.github/instructions/testing.instructions.md',
    template: 'github/instructions/testing.instructions.md',
  },
  {
    id: 'angular-instructions',
    path: '.github/instructions/angular.instructions.md',
    template: 'github/instructions/angular.instructions.md',
  },
];

/** JSON files merged with their template. */
export const JSON_FILES: readonly JsonFile[] = [
  { id: 'vscode-extensions', path: '.vscode/extensions.json', template: 'vscode/extensions.json' },
  { id: 'mcp', path: '.mcp.json', template: 'mcp.json' },
  { id: 'claude-settings', path: '.claude/settings.json', template: 'claude/settings.json' },
];

/** Ids of the files with a dedicated strategy. */
export const SPECIAL_FILE_IDS = {
  skills: 'skills',
  vscodeSettings: 'vscode-settings',
  nxJson: 'nx-json',
  agentsMd: 'agents-md',
} as const;

/** Resolved generator options. */
interface SyncContext {
  /** Selector prefix. */
  prefix: string;
  /** Excluded ids and paths. */
  exclude: string[];
  /** Extra commit scopes. */
  extraScopes: string[];
}

/**
 * Keeps the files that every workspace using the shared AtlasNG tooling has in common up to date. Registered as a
 * global sync generator, so `nx sync` applies it and `nx sync:check` reports drift.
 *
 * @param tree The virtual file system.
 * @param options Options that override the ones in `nx.json`. Nx passes none when it runs sync generators.
 * @returns An out-of-sync message when files changed.
 */
export async function syncGenerator(tree: Tree, options: SyncGeneratorSchema = {}): Promise<SyncGeneratorResult> {
  const context = resolveOptions(tree, options);
  const isIncluded = (id: string, path: string) => !isExcluded(context.exclude, id, path);
  const variables = templateVariables(context);

  for (const file of WHOLE_FILES.filter(({ id, path }) => isIncluded(id, path))) {
    writeIfChanged(tree, file.path, renderTemplate(readTemplate(file.template), variables));
  }

  syncSkills(tree, context, variables);

  for (const file of JSON_FILES.filter(({ id, path }) => isIncluded(id, path))) {
    updateJsonFile(tree, file.path, (json) => mergeShared(json, readTemplateJson(file.template)) as JsonObject);
  }

  if (isIncluded(SPECIAL_FILE_IDS.vscodeSettings, '.vscode/settings.json')) {
    syncVscodeSettings(tree, context);
  }

  if (isIncluded(SPECIAL_FILE_IDS.nxJson, 'nx.json')) {
    syncNxJson(tree, context);
  }

  if (isIncluded(SPECIAL_FILE_IDS.agentsMd, 'AGENTS.md')) {
    syncAgentsMd(tree, renderTemplate(readTemplate('agents.md'), variables));
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  for (const file of WHOLE_FILES.filter(({ id, path, executable }) => executable && isIncluded(id, path))) {
    ensureExecutable(tree, file.path);
  }

  const changes = tree.listChanges();
  if (changes.length === 0) {
    return undefined;
  }

  return {
    outOfSyncMessage: `The files managed by @atlasng/nx-plugin are out of date. Run "nx sync" to update them.`,
    outOfSyncDetails: changes.map((change) => `${change.type.toLowerCase()}: ${change.path}`),
  };
}

export default syncGenerator;

/**
 * Combines the options in `nx.json` with the ones passed in and fills in the defaults.
 *
 * @param tree The virtual file system.
 * @param options Options that take precedence over `nx.json`.
 * @returns The resolved options.
 */
function resolveOptions(tree: Tree, options: SyncGeneratorSchema): SyncContext {
  const configured = (readNxJson(tree)?.sync?.generatorOptions?.[SYNC_GENERATOR] ?? {}) as SyncGeneratorSchema;
  const merged = { ...configured, ...options };
  return {
    prefix: merged.prefix ?? readPrefix(tree),
    exclude: merged.exclude ?? [],
    extraScopes: merged.extraScopes ?? [],
  };
}

/**
 * Checks whether a managed file is excluded by id, by path or by one of its parent directories.
 *
 * @param exclude The excluded ids and paths.
 * @param id The managed-file id.
 * @param path The file path in the workspace.
 * @returns Whether the file must be left alone.
 */
export function isExcluded(exclude: readonly string[], id: string, path: string): boolean {
  return exclude.some((entry) => {
    const normalized = entry.replace(/^\.\//, '').replace(/\/+$/, '');
    return normalized === id || normalized === path || path.startsWith(`${normalized}/`);
  });
}

/**
 * Builds the values substituted into the templates.
 *
 * @param context The resolved options.
 * @returns The template variables by name.
 */
function templateVariables(context: SyncContext): Record<string, string> {
  const scopes = context.extraScopes.map((scope) => `\`${scope}\``);
  const scopeList = scopes.length > 1 ? `${scopes.slice(0, -1).join(', ')} and ${scopes.at(-1)}` : (scopes[0] ?? '');
  return {
    prefix: context.prefix,
    scopeNote: scopeList ? `, plus ${scopeList}` : '',
  };
}

/**
 * Replaces `{{name}}` placeholders. Unknown placeholders are left as they are.
 *
 * @param template The template text.
 * @param variables The values by placeholder name.
 * @returns The rendered text.
 */
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => variables[name] ?? match);
}

/**
 * Reads a template shipped with the plugin.
 *
 * @param path The template path, relative to the templates directory.
 * @returns The template text.
 */
function readTemplate(path: string): string {
  return readFileSync(join(FILES_DIR, path), 'utf8');
}

/**
 * Reads a JSON template shipped with the plugin.
 *
 * @param path The template path, relative to the templates directory.
 * @returns The parsed template.
 */
function readTemplateJson(path: string): JsonObject {
  return JSON.parse(readTemplate(path)) as JsonObject;
}

/**
 * Writes a file. Writing the current contents records no change.
 *
 * @param tree The virtual file system.
 * @param path The file path.
 * @param content The new contents.
 */
function writeIfChanged(tree: Tree, path: string, content: string): void {
  if (tree.read(path, 'utf8') !== content) {
    tree.write(path, content);
  }
}

/**
 * Updates a JSON file and only writes it when the parsed value changes, so comments and formatting survive a run
 * that has nothing to do.
 *
 * @param tree The virtual file system.
 * @param path The file path.
 * @param update Returns the new value for the current one (an empty object when the file is missing).
 */
function updateJsonFile(tree: Tree, path: string, update: (json: JsonObject) => JsonObject): void {
  const current = tree.exists(path) ? readJson<JsonObject>(tree, path) : {};
  const next = update(structuredClone(current));
  if (!tree.exists(path) || !isDeepStrictEqual(current, next)) {
    writeJson(tree, path, next);
  }
}

/**
 * Makes a managed script executable. Unchanged files are only touched when the file on disk lacks the executable
 * bit, because the tree cannot report file modes.
 *
 * @param tree The virtual file system.
 * @param path The file path.
 */
function ensureExecutable(tree: Tree, path: string): void {
  const changed = tree.listChanges().some((change) => change.path === path && change.type !== 'DELETE');
  if (changed || !isExecutableOnDisk(tree, path)) {
    tree.changePermissions(path, 0o755);
  }
}

/**
 * Checks the executable bit of a file on disk. Files that cannot be read, for example in an in-memory test tree,
 * count as executable so that no change is recorded for them.
 *
 * @param tree The virtual file system.
 * @param path The file path.
 * @returns Whether the owner may execute the file.
 */
function isExecutableOnDisk(tree: Tree, path: string): boolean {
  try {
    return (statSync(join(tree.root, path)).mode & 0o100) !== 0;
  } catch {
    return true;
  }
}

/**
 * Copies the team skills to `.agents/skills/atlasng-*` and removes `atlasng-*` skills and skill files that the plugin
 * no longer ships. Other skills are never touched.
 *
 * @param tree The virtual file system.
 * @param context The resolved options.
 * @param variables The template variables.
 */
function syncSkills(tree: Tree, context: SyncContext, variables: Record<string, string>): void {
  const isIncluded = (path: string) => !isExcluded(context.exclude, SPECIAL_FILE_IDS.skills, path);
  const shipped = new Map<string, string>();
  for (const template of listTemplateFiles('skills')) {
    shipped.set(joinPathFragments(SKILLS_DIR, relative('skills', template)), template);
  }

  for (const [path, template] of shipped) {
    if (isIncluded(path)) {
      writeIfChanged(tree, path, renderTemplate(readTemplate(template), variables));
    }
  }

  const managedDirs = tree.children(SKILLS_DIR).filter((name) => name.startsWith(SKILL_PREFIX));
  for (const file of managedDirs.flatMap((name) => listTreeFiles(tree, joinPathFragments(SKILLS_DIR, name)))) {
    if (!shipped.has(file) && isIncluded(file)) {
      tree.delete(file);
    }
  }
}

/**
 * Lists the template files below a templates subdirectory.
 *
 * @param dir The subdirectory, relative to the templates directory.
 * @returns The file paths, relative to the templates directory, with `/` separators.
 */
function listTemplateFiles(dir: string): string[] {
  return readdirSync(join(FILES_DIR, dir), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(FILES_DIR, join(entry.parentPath, entry.name)).split('\\').join('/'))
    .sort();
}

/**
 * Lists the files below a directory of the tree.
 *
 * @param tree The virtual file system.
 * @param dir The directory path.
 * @returns The file paths.
 */
function listTreeFiles(tree: Tree, dir: string): string[] {
  return tree.children(dir).flatMap((name) => {
    const path = joinPathFragments(dir, name);
    return tree.isFile(path) ? [path] : listTreeFiles(tree, path);
  });
}

/**
 * Merges the Nx Console generator lists into `.vscode/settings.json` and sets `conventionalCommits.scopes` to the
 * sorted project names plus the extra scopes.
 *
 * @param tree The virtual file system.
 * @param context The resolved options.
 */
function syncVscodeSettings(tree: Tree, context: SyncContext): void {
  const scopes = [...new Set([...getProjects(tree).keys(), ...context.extraScopes])].sort();
  updateJsonFile(tree, '.vscode/settings.json', (json) => ({
    ...(mergeShared(json, readTemplateJson('vscode/settings.json')) as JsonObject),
    'conventionalCommits.scopes': scopes,
  }));
}

/**
 * Merges the preset `namedInputs`, `targetDefaults` and `generators` into `nx.json` and sets the selector prefix
 * of the Angular generators. Local keys and entries are kept.
 *
 * @param tree The virtual file system.
 * @param context The resolved options.
 */
function syncNxJson(tree: Tree, context: SyncContext): void {
  const preset = JSON.parse(readFileSync(NX_PRESET_PATH, 'utf8')) as JsonObject;
  updateJsonFile(tree, 'nx.json', (nxJson) => {
    for (const key of NX_PRESET_KEYS) {
      nxJson[key] = mergeShared(nxJson[key] ?? {}, preset[key]);
    }

    const generators = nxJson['generators'] as JsonObject;
    for (const name of PREFIXED_GENERATORS) {
      const defaults = generators[name];
      generators[name] = { ...(isJsonObject(defaults) ? defaults : {}), prefix: context.prefix };
    }

    return nxJson;
  });
}

/**
 * Writes the managed section of `AGENTS.md` between {@link AGENTS_START} and {@link AGENTS_END}. The section is
 * appended when the markers are missing; everything outside the markers is kept.
 *
 * @param tree The virtual file system.
 * @param content The section contents.
 */
function syncAgentsMd(tree: Tree, content: string): void {
  const path = 'AGENTS.md';
  const block = `${AGENTS_START}\n${AGENTS_NOTE}\n\n${content.trim()}\n\n${AGENTS_END}`;
  const current = tree.read(path, 'utf8');
  if (current === null) {
    tree.write(path, `${block}\n`);
    return;
  }

  const start = current.indexOf(AGENTS_START);
  const end = current.indexOf(AGENTS_END, start);
  const next =
    start !== -1 && end !== -1
      ? `${current.slice(0, start)}${block}${current.slice(end + AGENTS_END.length)}`
      : `${current.trimEnd()}\n\n${block}\n`;
  writeIfChanged(tree, path, next);
}
