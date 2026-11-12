import { SearchPrimitive } from './types';

/** Name of the field used when the indexed items are strings or numbers and no fields are given. */
export const DEFAULT_SEARCH_VALUE_FIELD = 'value';

/**
 * Checks whether a value is searchable on its own.
 *
 * @param value Value to check.
 * @returns True for strings and numbers.
 */
export function isSearchPrimitive(value: unknown): value is SearchPrimitive {
  return typeof value === 'string' || typeof value === 'number';
}
