/**
 * Copies the defined properties of an object, so that `undefined` values do not mask defaults when spread.
 *
 * @param value Object to copy.
 * @returns The properties of the object whose value is not `undefined`.
 */
export function pickDefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}
