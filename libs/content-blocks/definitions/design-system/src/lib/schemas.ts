import { createSchema } from '@atlasng/content-blocks/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonValue } from 'type-fest';

/** Schema for a config value, as used by the definitions in this entry point. */
export type ConfigValueSchema<T> = StandardSchemaV1<JsonValue | undefined, T>;

/**
 * Creates a schema accepting values that pass a check.
 *
 * @param predicate Checks a value.
 * @param message Issue message for values that fail the check.
 * @returns The schema.
 */
function check<T>(predicate: (value: unknown) => value is T, message: string): ConfigValueSchema<T> {
  return createSchema<T, JsonValue | undefined>((value) => (predicate(value) ? { value } : { issues: [{ message }] }));
}

/**
 * Accepts strings.
 *
 * @returns The schema.
 */
export function string(): ConfigValueSchema<string> {
  return check((value): value is string => typeof value === 'string', 'Expected a string.');
}

/**
 * Accepts booleans.
 *
 * @returns The schema.
 */
export function boolean(): ConfigValueSchema<boolean> {
  return check((value): value is boolean => typeof value === 'boolean', 'Expected a boolean.');
}

/**
 * Accepts one of the given values.
 *
 * @param values Allowed values.
 * @returns The schema.
 */
export function oneOf<const T extends readonly (string | number)[]>(values: T): ConfigValueSchema<T[number]> {
  const list = values.map((value) => JSON.stringify(value)).join(', ');
  return check((value): value is T[number] => values.includes(value as T[number]), `Expected one of ${list}.`);
}

/**
 * Accepts heading levels, i.e. the numbers 1 to 6.
 *
 * @returns The schema.
 */
export function headingLevel(): ConfigValueSchema<1 | 2 | 3 | 4 | 5 | 6> {
  return oneOf([1, 2, 3, 4, 5, 6]);
}

/**
 * Makes a schema accept `undefined`, i.e. a missing key.
 *
 * @param schema Schema for present values.
 * @returns The schema.
 */
export function optional<T>(schema: ConfigValueSchema<T>): ConfigValueSchema<T | undefined> {
  return createSchema<T | undefined, JsonValue | undefined>((value) =>
    value === undefined ? { value } : schema['~standard'].validate(value),
  );
}
