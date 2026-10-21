import { StandardSchemaV1 } from '@standard-schema/spec';
import { formatIssues } from '../utils/standard-schema';

/**
 * Thrown when a node does not match its definition.
 *
 * Issue paths are relative to the node and start with `config`, `data`, or `content`, e.g. `['data', 'rows', 0]`.
 */
export class ContentValidationError extends Error {
  /** Error name used in messages and stack traces. */
  override readonly name = 'ContentValidationError';
  /** Path of the invalid node in the document, e.g. `content.@default[2].content.title`. */
  readonly path: string;
  /** Standard Schema issues describing the failures. */
  readonly issues: readonly StandardSchemaV1.Issue[];

  /**
   * @param path Path of the invalid node in the document.
   * @param issues Standard Schema issues describing the failures.
   */
  constructor(path: string, issues: readonly StandardSchemaV1.Issue[]) {
    super(formatIssues(path, issues));
    this.path = path;
    this.issues = issues;
  }
}

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
  } else if (typeof ngDevMode === 'undefined' || ngDevMode) {
    throw new ContentValidationError(path, issues);
  }

  // eslint-disable-next-line no-console
  console.warn(formatIssues(path, issues));
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
