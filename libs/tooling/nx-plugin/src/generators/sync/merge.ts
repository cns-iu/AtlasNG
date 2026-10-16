import { isDeepStrictEqual } from 'node:util';

/** A JSON object with unknown values. */
export type JsonObject = Record<string, unknown>;

/**
 * Keys whose values identify an object inside an array, for example `type` and `name` of an Angular budget, `glob` and
 * `input` of an asset, `plugin` of an `nx.json` plugin entry or `input`, `fileset` and `env` of an Nx input.
 */
const IDENTITY_KEYS = [
  'plugin',
  'type',
  'name',
  'id',
  'glob',
  'input',
  'target',
  'projects',
  'dependencies',
  'fileset',
  'runtime',
  'env',
  'dependentTasksOutputFiles',
] as const;

/**
 * Keys whose presence alone identifies an object inside an array. Their values are payload that is merged, for
 * example the package list of an Nx `{ "externalDependencies": [...] }` input.
 */
const KIND_KEYS = ['externalDependencies'] as const;

/**
 * Checks whether a value is a plain JSON object (not an array or `null`).
 *
 * @param value The value to check.
 * @returns Whether the value is a JSON object.
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Merges shared values into local ones without dropping anything local:
 *
 * - objects are merged key by key; local-only keys keep their position and new keys are appended
 * - arrays keep every local entry in order and get the missing shared entries appended. An object entry with the same
 *   identity keys (see {@link IDENTITY_KEYS} and {@link KIND_KEYS}) as a shared entry counts as the same entry: it
 *   keeps its local values and only gets the keys and array items it lacks
 * - any other shared value replaces the local one
 *
 * Neither input is modified. Merging the result with the same shared value again returns an equal value.
 *
 * @param local The value currently in the workspace, if any.
 * @param shared The value the sync generator manages.
 * @returns The merged value.
 */
export function mergeShared(local: unknown, shared: unknown): unknown {
  return merge(local, shared, false);
}

/**
 * Implements {@link mergeShared}.
 *
 * @param local The local value.
 * @param shared The shared value.
 * @param preferLocal Whether local scalars and local values of a different type win. This is the case inside an array
 *   entry that matched a shared entry by identity.
 * @returns The merged value.
 */
function merge(local: unknown, shared: unknown, preferLocal: boolean): unknown {
  if (isJsonObject(local) && isJsonObject(shared)) {
    const result: JsonObject = { ...local };
    for (const [key, value] of Object.entries(shared)) {
      result[key] = key in local ? merge(local[key], value, preferLocal) : structuredClone(value);
    }
    return result;
  }

  if (Array.isArray(local) && Array.isArray(shared)) {
    return mergeArrays(local, shared);
  }

  return preferLocal ? local : structuredClone(shared);
}

/**
 * Appends the shared entries that are missing from a local array. Entries equal to an existing one are skipped, and an
 * object entry with the identity of an existing entry is merged into it with the existing values winning.
 *
 * @param local The local array.
 * @param shared The shared array.
 * @returns The merged array.
 */
function mergeArrays(local: readonly unknown[], shared: readonly unknown[]): unknown[] {
  const result = [...local];
  for (const entry of shared) {
    if (result.some((existing) => isDeepStrictEqual(existing, entry))) {
      continue;
    }

    const identity = identityOf(entry);
    const index = identity === undefined ? -1 : result.findIndex((existing) => identityOf(existing) === identity);
    if (index === -1) {
      result.push(structuredClone(entry));
    } else {
      result[index] = merge(result[index], entry, true);
    }
  }

  return result;
}

/**
 * Computes the identity of an array entry from its {@link IDENTITY_KEYS} values and {@link KIND_KEYS}.
 *
 * @param entry The array entry.
 * @returns A string that is equal for entries with the same identity, or `undefined` when the entry is not an object
 *   or has none of the identity keys.
 */
function identityOf(entry: unknown): string | undefined {
  if (!isJsonObject(entry)) {
    return undefined;
  }

  const parts: unknown[] = [
    ...IDENTITY_KEYS.filter((key) => key in entry).map((key) => [key, entry[key]]),
    ...KIND_KEYS.filter((key) => key in entry),
  ];
  return parts.length > 0 ? JSON.stringify(parts) : undefined;
}
