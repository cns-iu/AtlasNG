import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Creates a Standard Schema from a validate function, e.g. for a loader's or parser's `configSchema` without depending
 * on a schema library.
 *
 * @example
 * ```ts
 * const configSchema = createSchema<{ url: string }>((value) => {
 *   const { url } = (value ?? {}) as Record<string, unknown>;
 *   return typeof url === 'string' ? { value: { url } } : { issues: [{ message: 'Expected a string.', path: ['url'] }] };
 * });
 * ```
 * @param validate Validates a value, returning its output or the issues found. May be async.
 * @returns The schema.
 */
export function createSchema<TOutput, TInput = unknown>(
  validate: (value: unknown) => StandardSchemaV1.Result<TOutput> | Promise<StandardSchemaV1.Result<TOutput>>,
): StandardSchemaV1<TInput, TOutput> {
  return { '~standard': { version: 1, vendor: 'atlasng', validate } };
}
