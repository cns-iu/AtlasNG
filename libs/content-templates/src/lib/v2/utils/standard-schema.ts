import { StandardSchemaV1 } from '@standard-schema/spec';
import { isPlainObject } from './guards';

/**
 * Checks whether a value is a Standard Schema: an object or function with a `~standard` property. Some libraries'
 * schemas, e.g. ArkType's, are callable.
 *
 * @param value Value to check.
 * @returns Whether the value is a Standard Schema.
 */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  return (typeof value === 'function' || isPlainObject(value)) && '~standard' in value;
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

/**
 * Formats issues as a single message, e.g. `Invalid content at 'content.@default[0]': data.rows[0]: Expected a string.`
 *
 * @param path Path of the node.
 * @param issues Issues to format.
 * @returns The message.
 */
export function formatIssues(path: string, issues: readonly StandardSchemaV1.Issue[]): string {
  return `Invalid content at '${path}': ${issues.map(formatIssue).join('; ')}`;
}

/**
 * Formats an issue as `<path>: <message>`, with indexes in brackets, e.g. `data.rows[0]: Expected a string.`
 *
 * @param issue Issue to format.
 * @returns The formatted issue.
 */
function formatIssue(issue: StandardSchemaV1.Issue): string {
  let path = '';
  for (const segment of issue.path ?? []) {
    const key = typeof segment === 'object' ? segment.key : segment;
    path += typeof key === 'number' ? `[${key}]` : `${path ? '.' : ''}${String(key)}`;
  }

  return path ? `${path}: ${issue.message}` : issue.message;
}
