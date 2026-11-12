import { StandardSchemaV1 } from '@standard-schema/spec';
import { Simplify } from 'type-fest';
import { ContentDefinition } from './definition';

/** Output type of a Standard Schema; `never` for values that are not schemas. */
type SchemaOutput<TSchema> = TSchema extends StandardSchemaV1 ? StandardSchemaV1.InferOutput<TSchema> : never;

/**
 * Makes the keys of an object type whose value accepts `undefined` optional, mirroring config validation, which leaves
 * `undefined` outputs out of the bound config.
 */
type OptionalizeUndefined<TObject> = Simplify<
  { [K in keyof TObject as undefined extends TObject[K] ? never : K]: TObject[K] } & {
    [K in keyof TObject as undefined extends TObject[K] ? K : never]?: TObject[K];
  }
>;

/**
 * Validated config a definition binds to its component, as a definition declared with `satisfies ContentDefinition`
 * types it: the output of a whole-object config schema, or the output of each per-key schema, where keys whose output
 * accepts `undefined` are optional. An empty record for definitions without config.
 *
 * @example
 * ```ts
 * export const tableDefinition = {
 *   name: 'table',
 *   component: Table,
 *   config: { caption: string(), rowHeight: optional(number()) },
 * } satisfies ContentDefinition;
 * type TableConfig = ContentConfigOf<typeof tableDefinition>; // { caption: string; rowHeight?: number }
 * ```
 */
export type ContentConfigOf<TDefinition extends ContentDefinition> = TDefinition extends { config: infer TSchema }
  ? TSchema extends StandardSchemaV1
    ? StandardSchemaV1.InferOutput<TSchema>
    : OptionalizeUndefined<{ [K in keyof TSchema]: SchemaOutput<TSchema[K]> }>
  : Record<string, never>;

/** Output type of a data schema entry: a bare schema, or a `{ schema, initialValue }` object. */
type DataEntryOutput<TEntry> = TEntry extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<TEntry>
  : TEntry extends { schema: infer TSchema }
    ? SchemaOutput<TSchema>
    : never;

/**
 * Validated data a definition binds to its component, as a definition declared with `satisfies ContentDefinition`
 * types it: the schema output of each data key, for bare schemas and `{ schema, initialValue }` entries alike. Every
 * key is bound, so none is optional; an `initialValue` is expected in the same form. An empty record for definitions
 * without data.
 *
 * @example
 * ```ts
 * export const tableDefinition = {
 *   name: 'table',
 *   component: Table,
 *   data: { rows: { schema: tableRows(), initialValue: () => [] } },
 * } satisfies ContentDefinition;
 * type TableData = ContentDataOf<typeof tableDefinition>; // { rows: Record<string, unknown>[] }
 * ```
 */
export type ContentDataOf<TDefinition extends ContentDefinition> = TDefinition extends { data: infer TSchema }
  ? Simplify<{ [K in keyof TSchema]: DataEntryOutput<TSchema[K]> }>
  : Record<string, never>;
