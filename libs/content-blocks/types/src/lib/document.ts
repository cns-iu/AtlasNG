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
  /** CSS classes added to the component's host element, as a space separated string or a list. */
  classes?: string | string[];
  /**
   * Inline styles set on the component's host element, keyed by property, e.g. `{ "maxWidth": "40rem" }`,
   * `{ "max-width": "40rem" }`, or a custom property such as `{ "--gap": "1rem" }`. Numbers are set as is, without a
   * unit, and a value ending in `!important` is set as important.
   */
  styles?: Record<string, string | number>;
  /** Raw configuration, validated by the definition's config schema. */
  config?: Record<string, JsonValue>;
  /**
   * Named data, loaded once the node's definition is known and validated by the definition's data schemas. A string is
   * loaded from that URL with the configured `defaultLoader`, an array is inline data loaded with the configured
   * `defaultInlineLoader`, and an object is a {@link ContentDataSource}.
   */
  data?: Record<string, string | JsonValue[] | ContentDataSource>;
  /**
   * Projected content. A node or node list targets the definition's default `content` entry. An object without
   * `component` maps content names from the definition's `content` to nodes, so a content name cannot be `component`.
   */
  content?: Arrayable<ContentNode> | Record<string, Arrayable<ContentNode>>;
}

/**
 * Describes how a data value is loaded and parsed. The source is the loader's config: `type` names a registered loader,
 * e.g. `http`, and the other keys except `parser` are passed to it, so a loader config cannot use a `parser` key.
 */
export interface ContentDataSource {
  /** Registered loader name, e.g. `http`. */
  type: string;
  /** Optional parser applied to the loader's result, as a name, e.g. `csv`, or a config object naming it in `type`. */
  parser?: string | { type: string; [key: string]: JsonValue };
  /** Loader specific config, e.g. `url`. */
  [key: string]: JsonValue | undefined;
}
