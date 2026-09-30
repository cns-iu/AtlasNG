import { Type } from '@angular/core';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentElementNode } from '../types/content-document';

/** A resolved node: text, or an element whose parts load in the background. */
export type ResolvedContentNode = ResolvedContentText | ResolvedContentElement;

/** A text node. */
export interface ResolvedContentText {
  /** Node discriminator. */
  kind: 'text';
  /** Path of the node in the document, e.g. `content.0.content.1`. */
  path: string;
  /** Text content. */
  text: string;
}

/**
 * An element node. Every promise starts when the document is resolved, independent of its parent, and is marked as
 * handled, so a rejection is only reported to code awaiting it.
 */
export interface ResolvedContentElement {
  /** Node discriminator. */
  kind: 'element';
  /** Path of the node in the document, e.g. `content.2`. */
  path: string;
  /** The source node. */
  node: ContentElementNode;
  /** The node's definition. */
  definition: Promise<ContentComponentDefinition>;
  /** The component class to render. */
  component: Promise<Type<unknown>>;
  /** Validated config outputs keyed by config key. Keys whose output is `undefined` are omitted. */
  config: Promise<Record<string, unknown>>;
  /** Loaded, parsed, and validated data keyed by data name. Keys whose value is `undefined` are omitted. */
  data: Promise<Record<string, unknown>>;
  /** Content not keyed by slot, for the definition's `defaultSlot`. */
  defaultContent: ResolvedContentNode[];
  /** Content keyed by slot name. */
  slotContent: Record<string, ResolvedContentNode[]>;
  /** Settles once `definition`, `component`, `config`, and `data` have all settled; rejects if any of them rejects. */
  ready: Promise<void>;
}
