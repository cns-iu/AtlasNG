import { StandardSchemaV1 } from '@standard-schema/spec';

/** Shared instance returned by {@link passthroughSchema}. */
const PASSTHROUGH_SCHEMA: StandardSchemaV1<unknown, unknown> = {
  '~standard': {
    version: 1,
    vendor: 'atlasng',
    validate: (value) => ({ value }),
  },
};

/**
 * Creates a Standard Schema that accepts any value as is, e.g. `data: { rows: passthroughSchema<Row[]>() }`. The type
 * argument only types the output; nothing is validated at runtime.
 *
 * @returns A schema passing its input through unchanged.
 */
export function passthroughSchema<T = unknown>(): StandardSchemaV1<T, T> {
  return PASSTHROUGH_SCHEMA as StandardSchemaV1<T, T>;
}
