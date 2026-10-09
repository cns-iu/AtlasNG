import { readNxJson, type Tree } from '@nx/devkit';

/** Selector prefix used when a workspace does not configure one. */
export const DEFAULT_PREFIX = 'app';

/** Angular generators whose `nx.json` defaults carry the selector prefix, in lookup order. */
export const PREFIXED_GENERATORS = [
  '@nx/angular:component',
  '@nx/angular:application',
  '@nx/angular:library',
  '@nx/angular:directive',
] as const;

/**
 * Reads the Angular selector prefix from the `nx.json` generator defaults.
 *
 * @param tree The virtual file system.
 * @returns The configured prefix, or {@link DEFAULT_PREFIX}.
 */
export function readPrefix(tree: Tree): string {
  const generators = (readNxJson(tree)?.generators ?? {}) as Record<string, { prefix?: string } | undefined>;
  for (const name of PREFIXED_GENERATORS) {
    const prefix = generators[name]?.prefix;
    if (prefix) {
      return prefix;
    }
  }

  return DEFAULT_PREFIX;
}
