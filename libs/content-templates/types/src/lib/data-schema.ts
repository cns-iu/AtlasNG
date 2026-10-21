import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Validates a node's `data`, keyed by data name. Unknown data keys are errors.
 *
 * Each entry is a schema, or a schema with a `defaultValue` used when the node does not provide the key. Without a
 * default, `undefined` is validated, so the schema decides optionality. Use `passthroughSchema()` from
 * `@atlasng/content-templates/utils` to accept any value.
 */
export type ContentDataSchema = Record<
  string,
  | StandardSchemaV1<unknown>
  | {
      /** Schema validating the loaded and parsed value. */
      schema: StandardSchemaV1<unknown>;
      /**
       * Value used when the node does not provide this key. A function is called each time a default is needed, so
       * each node gets a fresh value; to default to a function itself, return it from a function.
       */
      defaultValue?: unknown | (() => unknown);
    }
>;
