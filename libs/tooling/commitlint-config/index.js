// @ts-check
import nxScopes from '@commitlint/config-nx-scopes';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Commitlint context passed to configuration rule functions.
 *
 * @typedef {object} CommitlintContext
 * @property {string} [cwd] Directory commitlint runs in. Defaults to `process.cwd()`.
 */

/**
 * Subset of an Nx project configuration that project selectors receive.
 *
 * @typedef {object} ProjectSummary
 * @property {string} name Project name.
 * @property {string} [projectType] Either `application` or `library` when declared.
 * @property {string[]} [tags] Tags declared on the project.
 */

/**
 * Predicate that decides whether a project contributes a commit scope.
 *
 * @callback ProjectSelector
 * @param {ProjectSummary} project Project to test.
 * @returns {boolean} Whether the project name is an allowed scope.
 */

/**
 * Commitlint rule configuration tuple for `scope-enum`. The severity `2` is an error.
 *
 * @typedef {[2, 'always', string[]]} ScopeEnumRuleConfig
 */

/**
 * Helpers exposed for consumers that extend the shared configuration.
 *
 * @typedef {object} CommitlintConfigUtils
 * @property {typeof getProjects} getProjects Lists Nx project names usable as commit scopes.
 * @property {typeof isNxSelfHealingCommit} isNxSelfHealingCommit Detects Nx Cloud self-healing CI commits.
 */

/**
 * Shared commitlint configuration.
 *
 * @typedef {object} CommitlintConfig
 * @property {string[]} extends Configurations this configuration builds on.
 * @property {((message: string) => boolean)[]} ignores Predicates for commit messages commitlint skips.
 * @property {{ 'scope-enum': (ctx?: CommitlintContext) => Promise<ScopeEnumRuleConfig> }} rules Rule overrides.
 * @property {CommitlintConfigUtils} utils Helpers for extending the configuration.
 */

/** Matches the marker Nx Cloud adds to commits created by self-healing CI reruns. */
const NX_SELF_HEALING_RERUN_PATTERN = /\[Self-Healing CI Rerun\]/iu;

/**
 * Checks whether a commit was produced by Nx Cloud's self-healing CI.
 *
 * @param {string} message The complete commit message.
 * @returns {boolean} Whether commitlint should ignore the message.
 */
function isNxSelfHealingCommit(message) {
  return NX_SELF_HEALING_RERUN_PATTERN.test(message);
}

/**
 * Lists the Nx project names in the workspace, for use as commit scopes. Scoped names such as
 * `@org/name` are reduced to `name`.
 *
 * @param {CommitlintContext} [ctx] Commitlint context; its `cwd` locates the workspace.
 * @param {ProjectSelector} [selector] Optional filter applied to each project.
 * @returns {string[]} Matching project names, or an empty list when `cwd` has no `nx.json`.
 */
function getProjects(ctx, selector) {
  const cwd = ctx?.cwd || process.cwd();
  if (!fs.existsSync(path.join(cwd, 'nx.json'))) {
    return [];
  }

  return nxScopes.utils.getProjects({ ...ctx, cwd }, selector);
}

/** @type {CommitlintConfig} */
const config = {
  extends: ['@commitlint/config-conventional'],
  ignores: [isNxSelfHealingCommit],
  rules: {
    'scope-enum': async (ctx) => [2, 'always', getProjects(ctx)],
  },
  utils: { getProjects, isNxSelfHealingCommit },
};

export default config;
