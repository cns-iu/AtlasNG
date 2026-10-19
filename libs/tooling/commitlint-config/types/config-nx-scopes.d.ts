/**
 * Minimal typings for the untyped `@commitlint/config-nx-scopes` package, limited to the API this
 * package uses.
 */
declare module '@commitlint/config-nx-scopes' {
  /** Project fields passed to a selector. */
  interface NxScopesProject {
    name: string;
    projectType?: string;
    tags?: string[];
  }

  /** Default export of `@commitlint/config-nx-scopes`. */
  const config: {
    utils: {
      getProjects(context?: { cwd?: string }, selector?: (project: NxScopesProject) => boolean): string[];
    };
  };

  export default config;
}
