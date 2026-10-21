import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Validates a node's `data`, keyed by data name. Unknown data keys are errors.
 *
 * Each entry is a schema, or a schema with an `initialValue`. The initial value is the key's value while the node's
 * data loads, and its only value when the node does not provide the key; it is not validated. Without one, a missing
 * key is validated as `undefined`, so the schema decides optionality. Use `passthroughSchema()` from
 * `@atlasng/content-templates/utils` to accept any value.
 */
export type ContentDataSchema = Record<
  string,
  | StandardSchemaV1<unknown>
  | {
      /** Schema validating the loaded and parsed value. */
      schema: StandardSchemaV1<unknown>;
      /**
       * Value of this key until the node's data is loaded, or for good when the node does not provide the key. It is
       * passed to the component as is, so give it in the schema's output form; it is not validated. A function is
       * called each time the value is needed, so each node gets a fresh value; to use a function itself, return it
       * from a function.
       */
      initialValue?: unknown | (() => unknown);
    }
>;
