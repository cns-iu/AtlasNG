import { isDeepStrictEqual } from 'node:util';

/** A JSON object with unknown values. */
export type JsonObject = Record<string, unknown>;

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
 * - arrays become the union of both, keeping the local order and appending missing shared entries
 * - any other shared value replaces the local one
 *
 * Neither input is modified.
 *
 * @param local The value currently in the workspace, if any.
 * @param shared The value the sync generator manages.
 * @returns The merged value.
 */
export function mergeShared(local: unknown, shared: unknown): unknown {
  if (isJsonObject(local) && isJsonObject(shared)) {
    const result: JsonObject = { ...local };
    for (const [key, value] of Object.entries(shared)) {
      result[key] = key in local ? mergeShared(local[key], value) : structuredClone(value);
    }
    return result;
  }

  if (Array.isArray(local) && Array.isArray(shared)) {
    const missing = shared.filter((entry) => !local.some((existing) => isDeepStrictEqual(existing, entry)));
    return [...local, ...structuredClone(missing)];
  }

  return structuredClone(shared);
}
