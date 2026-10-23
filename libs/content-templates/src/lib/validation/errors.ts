import { ContentValidationError } from '@atlasng/content-templates/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Reports issues that are recoverable, such as unknown keys: throws in dev mode, and warns in prod mode so the caller
 * can continue without the offending keys.
 *
 * @param path Path of the node.
 * @param issues Issues to report. Nothing is reported when empty.
 * @throws {ContentValidationError} In dev mode, when there are issues.
 */
export function reportRecoverableIssues(path: string, issues: readonly StandardSchemaV1.Issue[]): void {
  if (issues.length === 0) {
    return;
  }

  const error = new ContentValidationError(path, issues);
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    throw error;
  }

  // eslint-disable-next-line no-console
  console.warn(error.message);
}

/**
 * Creates issues for keys a definition does not declare.
 *
 * @param name Definition name, used in messages.
 * @param property Node property the keys belong to, e.g. `data`. Used in messages and as the issue path prefix.
 * @param keys Keys the node provides.
 * @param declared Keys the definition declares, or `undefined` when it does not accept the property at all.
 * @returns One issue per unknown key, or a single issue when the property is not accepted at all.
 */
export function checkUnknownKeys(
  name: string,
  property: string,
  keys: string[],
  declared: object | undefined,
): StandardSchemaV1.Issue[] {
  if (keys.length > 0 && declared === undefined) {
    return [{ message: `Component '${name}' does not accept ${property}.`, path: [property] }];
  }

  const unknownKeys = declared ? keys.filter((key) => !Object.hasOwn(declared as object, key)) : keys;
  return unknownKeys.map((key) => ({ message: `Unknown ${property} key '${key}'.`, path: [property, key] }));
}
