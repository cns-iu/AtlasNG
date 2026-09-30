import { Type } from '@angular/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonObject, JsonValue, Promisable } from 'type-fest';

/** Module shape of a lazy import whose value is the default export. */
export interface DefaultExport<T> {
  /** The default exported value. */
  default: T;
}

/**
 * A component class, or a loader resolving to the class or to a module that default exports it.
 * Classes and loaders are told apart with `reflectComponentType`.
 */
export type ComponentOrLoader<T> = Type<T> | (() => Promisable<Type<T> | DefaultExport<Type<T>>>);

/**
 * Validates a node's `config`. Either a single schema for the whole config object, or a schema per config key.
 * With a per-key record, keys without a schema are errors, and a missing key is validated as `undefined`.
 */
export type ContentComponentConfigSchema =
  StandardSchemaV1<JsonObject, object> | Record<string, StandardSchemaV1<JsonValue | undefined, unknown>>;

/**
 * Validates a node's `data`, keyed by data name. Unknown data keys are errors.
 *
 * Each entry is `'any'` (accepted without validation), a schema, or a schema with a `defaultValue` used when the node
 * does not provide the key. Without a default, `undefined` is validated, so the schema decides optionality.
 */
export type ContentComponentDataSchema = Record<
  string,
  | 'any'
  | StandardSchemaV1<unknown>
  | {
      /** Schema validating the loaded and parsed value, or `'any'` to skip validation. */
      schema: 'any' | StandardSchemaV1<unknown>;
      /** Value used when the node does not provide this key. */
      defaultValue?: unknown;
    }
>;

/**
 * Describes how a {@link ContentElementNode} is rendered. Validated config and data outputs are bound to component
 * inputs by template name.
 */
export interface ContentComponentDefinition<TComponent = unknown> {
  /** Unique name, matched against {@link ContentElementNode.component}. */
  name: string;
  /** Component rendered for the node, or a lazy loader for it. */
  component: ComponentOrLoader<TComponent>;
  /** Schema for the node's `config`. When absent, the node must not provide config. */
  config?: ContentComponentConfigSchema;
  /** Schemas for the node's `data`. When absent, the node must not provide data. */
  data?: ContentComponentDataSchema;
  /**
   * Maps friendly slot names used in the document to the component's `ng-content` selectors,
   * e.g. `{ content: '*', title: '[slot=title]' }`.
   */
  slots?: Record<string, string>;
  /** Key of {@link slots} receiving content that is not keyed by slot, e.g. `content`. */
  defaultSlot?: string;
  /**
   * Rendered synchronously while the node's subtree resolves; its presence makes the node an async boundary.
   * Receives the node and this definition through `node` and `definition` inputs, when it declares them.
   */
  placeholder?: Type<unknown>;
  /**
   * Rendered when the node's boundary fails. Falls back to the renderer default. Receives the node, this definition,
   * and the thrown value through `node`, `definition`, and `error` inputs, when it declares them.
   */
  error?: ComponentOrLoader<unknown>;
}
