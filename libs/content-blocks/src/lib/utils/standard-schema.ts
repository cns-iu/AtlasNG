import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Checks whether a value is a Standard Schema: an object or function with a `~standard` property. Some libraries'
 * schemas, e.g. ArkType's, are callable.
 *
 * @param value Value to check.
 * @returns Whether the value is a Standard Schema.
 */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  return (typeof value === 'function' || (typeof value === 'object' && value !== null)) && '~standard' in value;
}

/**
 * Prefixes issue paths so they are relative to the node.
 *
 * @param issues Issues reported by a schema.
 * @param prefix Path segments to prepend.
 * @returns Issues with prefixed paths.
 */
export function prefixIssues(
  issues: readonly StandardSchemaV1.Issue[],
  prefix: PropertyKey[],
): StandardSchemaV1.Issue[] {
  return issues.map((issue) => ({ ...issue, path: [...prefix, ...(issue.path ?? [])] }));
}
