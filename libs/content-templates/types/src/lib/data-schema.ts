import { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Validates a node's `data`, keyed by data name. Unknown data keys are errors.
 *
 * Each entry is `'any'` (accepted without validation), a schema, or a schema with a `defaultValue` used when the node
 * does not provide the key. Without a default, `undefined` is validated, so the schema decides optionality.
 */
export type ContentDataSchema = Record<
  string,
  | 'any'
  | StandardSchemaV1<unknown>
  | {
      /** Schema validating the loaded and parsed value, or `'any'` to skip validation. */
      schema: 'any' | StandardSchemaV1<unknown>;
      /**
       * Value used when the node does not provide this key. A function is called each time a default is needed, so
       * each node gets a fresh value; to default to a function itself, return it from a function.
       */
      defaultValue?: unknown | (() => unknown);
    }
>;
