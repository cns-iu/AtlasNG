import type { Arrayable, JsonValue } from 'type-fest';

/** Current version of the {@link ContentDocument} format. */
export const CONTENT_DOCUMENT_VERSION = 1;

/** Root of a deserialized content document. */
export interface ContentDocument {
  /** Format version, allowing future migrations. */
  version: typeof CONTENT_DOCUMENT_VERSION;
  /** Top level nodes, rendered in order. */
  content: Arrayable<ContentNode>;
}

/** A node in a content document. A plain string is rendered as a text node. */
export type ContentNode = string | ContentElementNode;

/** A node rendered as a registered component. */
export interface ContentElementNode {
  /** Name of the component definition used to render this node, e.g. `content-paragraph`. */
  component: string;
  /** Raw configuration, validated by the definition's config schema. */
  config?: Record<string, JsonValue>;
  /**
   * Named data, loaded eagerly and validated by the definition's data schemas. A string is a source for the default
   * loader, an array is inline data used as is, and an object is a {@link ContentDataSource}.
   */
  data?: Record<string, string | unknown[] | ContentDataSource>;
  /**
   * Projected content. A node or node list targets the definition's `defaultSlot`. An object without `component` maps
   * slot names from the definition's `slots` to content, so a slot cannot be named `component`.
   */
  content?: Arrayable<ContentNode> | Record<string, Arrayable<ContentNode>>;
}

/** Describes how a data value is loaded and parsed. */
export interface ContentDataSource {
  /** Registered loader name, e.g. `http`, or a config object naming the loader in `type`. */
  loader: string | { type: string; [key: string]: JsonValue };
  /** Optional parser applied to the loader's result, as a name, e.g. `csv`, or an object shaped like `loader`. */
  parser?: string | { type: string; [key: string]: JsonValue };
}
