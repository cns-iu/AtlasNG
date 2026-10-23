import { StandardSchemaV1 } from '@standard-schema/spec';

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
 * Formats issues as a single message, e.g. `Invalid content at 'content.@default[0]': data.rows[0]: Expected a string.`
 *
 * @param path Path of the node.
 * @param issues Issues to format.
 * @returns The message.
 */
function formatIssues(path: string, issues: readonly StandardSchemaV1.Issue[]): string {
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
