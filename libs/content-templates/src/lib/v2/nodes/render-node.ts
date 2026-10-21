import { ContentElementNode, DEFAULT_CONTENT } from '@atlasng/content-templates/types';

/** A node of the render tree: plain text, or an element rendered through a content definition. */
export type RenderNode = RenderTextNode | RenderElementNode;

/** Content list of a node: a content name, or {@link DEFAULT_CONTENT} for unkeyed and top level content. */
export type RenderNodeKey = string | typeof DEFAULT_CONTENT;

/** Content of an element keyed by content name; content not keyed by name is stored under {@link DEFAULT_CONTENT}. */
export type RenderNodeContent = Partial<Record<RenderNodeKey, RenderNode[]>>;

/** Path segment shown for content not keyed by name. */
const DEFAULT_CONTENT_SEGMENT = '@default';

/**
 * Formats the document path of a node position, e.g. `content.@default[0].content.body[1]`. Content not keyed by name
 * is shown as `@default`, and the index is omitted for content given as a single node.
 *
 * @param parent Enclosing element, or `null` for top level content.
 * @param key Content list holding the position.
 * @param index Index in the content list, or `undefined` for a single node.
 * @returns The path.
 */
export function getRenderNodePath(parent: RenderElementNode | null, key: RenderNodeKey, index?: number): string {
  const segments: (string | number)[] = [];

  if (parent) {
    segments.push(parent.path, '.');
  }

  segments.push('content', '.', key === DEFAULT_CONTENT ? DEFAULT_CONTENT_SEGMENT : key);

  if (index !== undefined) {
    segments.push('[', index, ']');
  }

  return segments.join('');
}

/** Position of a node in the render tree, shared by every node kind. */
export abstract class RenderNodeLocation {
  /** Enclosing element, or `null` for top level nodes. */
  readonly parent: RenderElementNode | null;
  /** Content list holding the node. */
  readonly key: RenderNodeKey;
  /** Index of the node in its content list, or `undefined` for content given as a single node. */
  readonly index?: number;
  /** Cached {@link path}. The tree does not change once built. */
  #path?: string;

  /**
   * @param parent Enclosing element, or `null` for top level nodes.
   * @param key Content list holding the node.
   * @param index Index of the node in its content list, or `undefined` for a single node.
   */
  constructor(parent: RenderElementNode | null, key: RenderNodeKey, index?: number) {
    this.parent = parent;
    this.key = key;
    this.index = index;
  }

  /** Document path of the node, built by walking its parents, e.g. `content.@default[0].content.body[1]`. */
  get path(): string {
    return (this.#path ??= getRenderNodePath(this.parent, this.key, this.index));
  }
}

/** A plain text node. */
export class RenderTextNode extends RenderNodeLocation {
  /** Node discriminator. */
  readonly kind = 'text';
  /** Text content. */
  readonly text: string;

  /**
   * @param parent Enclosing element, or `null` for top level nodes.
   * @param key Content list holding the node.
   * @param index Index of the node in its content list, or `undefined` for a single node.
   * @param text Text content.
   */
  constructor(parent: RenderElementNode | null, key: RenderNodeKey, index: number | undefined, text: string) {
    super(parent, key, index);
    this.text = text;
  }
}

/** An element node, rendered with the definition named by `source.component`. */
export class RenderElementNode extends RenderNodeLocation {
  /** Node discriminator. */
  readonly kind = 'element';
  /** The document node. */
  readonly source: ContentElementNode;
  /** Aborted when the node is discarded; also aborted with its parent, or with the document for top level nodes. */
  readonly abortController = new AbortController();
  /** Child nodes keyed by content name. */
  readonly content: RenderNodeContent = {};

  /**
   * @param parent Enclosing element, or `null` for top level nodes.
   * @param key Content list holding the node.
   * @param index Index of the node in its content list, or `undefined` for a single node.
   * @param source The document node.
   * @param signal Signal that aborts the node. Defaults to the parent's; top level nodes pass the document's.
   */
  constructor(
    parent: RenderElementNode | null,
    key: RenderNodeKey,
    index: number | undefined,
    source: ContentElementNode,
    signal = parent?.abortController.signal,
  ) {
    super(parent, key, index);
    this.source = source;
    this.#connectAbortSignal(signal);
  }

  /**
   * Aborts this node, with the same reason, when `signal` aborts. The listener is removed once this node aborts.
   *
   * @param signal Signal to follow, if any.
   */
  #connectAbortSignal(signal?: AbortSignal): void {
    const { abortController } = this;
    if (!signal) {
      return;
    }

    if (signal.aborted) {
      abortController.abort(signal.reason);
    } else {
      signal.addEventListener('abort', () => abortController.abort(signal.reason), {
        once: true,
        signal: abortController.signal,
      });
    }
  }
}
