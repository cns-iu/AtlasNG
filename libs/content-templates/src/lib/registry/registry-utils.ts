/**
 * Merges multi-provider records into one map.
 *
 * @param kind Human-readable kind used in error messages, e.g. `data loader`.
 * @param records Records collected from a multi token.
 * @returns Entries keyed by name.
 * @throws In dev mode, when a name is registered more than once.
 */
export function mergeEntries<T>(kind: string, records: Record<string, T>[]): Map<string, T> {
  const entries = new Map<string, T>();
  for (const record of records) {
    for (const [name, value] of Object.entries(record)) {
      if ((typeof ngDevMode === 'undefined' || ngDevMode) && entries.has(name)) {
        throw new Error(`Duplicate ${kind} '${name}'.`);
      }
      entries.set(name, value);
    }
  }

  return entries;
}

/**
 * Creates the error reported for an unregistered name.
 *
 * @param kind Human-readable kind, e.g. `data loader`.
 * @param name Requested name.
 * @returns The error.
 */
export function unknownNameError(kind: string, name: string): Error {
  return new Error(`Unknown ${kind} '${name}'.`);
}
