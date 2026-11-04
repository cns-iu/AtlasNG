import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonValue } from 'type-fest';

/**
 * Validates a node's `config`. Either a single schema for the whole config object, or a schema per config key.
 * With a per-key record, keys without a schema are errors, and a missing key is validated as `undefined`.
 */
export type ContentConfigSchema =
  StandardSchemaV1<JsonValue, object> | Record<string, StandardSchemaV1<JsonValue | undefined, unknown>>;
