import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Thrown when a node's config or data does not match its definition.
 *
 * Issue paths are relative to the node and start with `config` or `data`, e.g. `['data', 'rows', 0]`.
 */
export class ContentValidationError extends Error {
  /** Error name used in messages and stack traces. */
  override readonly name = 'ContentValidationError';

  /**
   * Creates a validation error.
   *
   * @param path Path of the invalid node in the document, e.g. `content.2.content.title.0`.
   * @param issues Standard Schema issues describing the failures.
   */
  constructor(
    readonly path: string,
    readonly issues: readonly StandardSchemaV1.Issue[],
  ) {
    super(`Invalid content at '${path}': ${issues.map(formatIssue).join('; ')}`);
  }
}

/**
 * Formats an issue as `<dotted path>: <message>`.
 *
 * @param issue Issue to format.
 * @returns The formatted issue.
 */
function formatIssue(issue: StandardSchemaV1.Issue): string {
  const segments = (issue.path ?? []).map((segment) => String(typeof segment === 'object' ? segment.key : segment));
  return segments.length > 0 ? `${segments.join('.')}: ${issue.message}` : issue.message;
}
