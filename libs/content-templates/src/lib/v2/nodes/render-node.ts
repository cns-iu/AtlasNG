import { ComponentMirror, Signal, signal, Type } from '@angular/core';
import { ContentDefinition, ContentElementNode, DEFAULT_CONTENT } from '@atlasng/content-templates/types';

/** A node of the render tree: plain text, or an element rendered through a content definition. */
export type RenderNode = RenderTextNode | RenderElementNode;

/** Content list of a node: a content name, or {@link DEFAULT_CONTENT} for unkeyed and top level content. */
export type RenderNodeKey = string | typeof DEFAULT_CONTENT;

/** Content of an element keyed by content name; content not keyed by name is stored under {@link DEFAULT_CONTENT}. */
export type RenderNodeContent = Partial<Record<RenderNodeKey, RenderNode[]>>;

/** Everything needed to render an element node, produced by the pipeline. */
export interface ResolvedElement {
  /** The node's definition. */
  definition: ContentDefinition;
  /** Component class rendered for the node. */
  component: Type<unknown>;
  /** Component mirror for the node. */
  mirror: ComponentMirror<unknown>;
  /** Validated config outputs keyed by config key. */
  config: Record<string, unknown>;
  /** Validated data keyed by data key. Each signal holds the latest valid value. */
  data: Record<string, Signal<unknown>>;
}

/** Path segment shown for content not keyed by name. */
const DEFAULT_CONTENT_SEGMENT = '@default';

/**
 * Checks whether a render node is a text node.
 *
 * @param node Node to check.
 * @returns Whether the node is a {@link RenderTextNode}.
 */
export function isRenderTextNode(node: RenderNode): node is RenderTextNode {
  return node.kind === 'text';
}

/**
 * Checks whether a render node is an element node.
 *
 * @param node Node to check.
 * @returns Whether the node is a {@link RenderElementNode}.
 */
export function isRenderElementNode(node: RenderNode): node is RenderElementNode {
  return node.kind === 'element';
}

/**
 * Position in the render tree. Base of every node kind, and used on its own for the path of an invalid document node
 * that gets no render node.
 */
export class RenderNodeLocation {
  /** Enclosing element, or `null` for top level nodes. */
  readonly parent: RenderElementNode | null;
  /** Content list holding the node. */
  readonly key: RenderNodeKey;
  /** Index of the node in its content list, or `undefined` for content given as a single node. */
  readonly index?: number;
  /** Cached {@link path}. */
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
    this.#path ??= this.#computePath();
    return this.#path;
  }

  /**
   * Formats {@link path}. Content not keyed by name is shown as `@default`, and the index is omitted for content given
   * as a single node.
   *
   * @returns The path.
   */
  #computePath(): string {
    const { parent, key, index } = this;
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
  /** Child nodes keyed by content name. */
  readonly content: RenderNodeContent = {};
  /** Controller behind {@link abortSignal}. */
  readonly #abortController = new AbortController();

  /** Backing signal of {@link error}, written by {@link fail}. */
  readonly #error = signal<unknown>(undefined);
  /** First error of the node, from any step or a later data emission. `undefined` while the node has not failed. */
  readonly error = this.#error.asReadonly();
  /**
   * The node's definition, checked for unknown keys. Set when the parent releases the node, so it stays `undefined`
   * for nodes under a failed or aborted parent, and for nodes dropped with unknown content.
   */
  definition?: Promise<ContentDefinition>;
  /**
   * Everything needed to render the node, i.e. its component, config, and data. Set once {@link definition} resolves,
   * and `undefined` while {@link definition} is.
   */
  resolved?: Promise<ResolvedElement>;

  /** Aborted when the node fails or is discarded, and with its parent or, for top level nodes, the document. */
  get abortSignal(): AbortSignal {
    return this.#abortController.signal;
  }

  /** Content names in content order, including {@link DEFAULT_CONTENT} when the node has unkeyed content. */
  get contentKeys(): RenderNodeKey[] {
    return Reflect.ownKeys(this.content) as RenderNodeKey[];
  }

  /** Child nodes in content order, unkeyed content included. Not cached, since prod mode drops unknown content. */
  get children(): RenderNode[] {
    return this.contentKeys.flatMap((key) => this.content[key] ?? []);
  }

  /** Element children in content order, i.e. the {@link children} that go through the pipeline. */
  get elementChildren(): RenderElementNode[] {
    return this.children.filter(isRenderElementNode);
  }

  /**
   * @param parent Enclosing element, or `null` for top level nodes.
   * @param key Content list holding the node.
   * @param index Index of the node in its content list, or `undefined` for a single node.
   * @param source The document node.
   * @param abortSignal Signal that aborts the node. Defaults to the parent's; top level nodes pass the document's.
   */
  constructor(
    parent: RenderElementNode | null,
    key: RenderNodeKey,
    index: number | undefined,
    source: ContentElementNode,
    abortSignal = parent?.abortSignal,
  ) {
    super(parent, key, index);
    this.source = source;
    this.#connectAbortSignal(abortSignal);
  }

  /**
   * Marks the node as failed and aborts it, so its pending loads and data streams stop and its children are not
   * released. Only the first error is kept in {@link error}.
   *
   * @param error The thrown value.
   */
  fail(error: unknown): void {
    this.#error.update((current) => current ?? error);
    this.#abortController.abort(error);
  }

  /**
   * Aborts this node, with the same reason, when `abortSignal` aborts. The listener is removed once this node aborts.
   *
   * @param abortSignal Signal to follow, if any.
   */
  #connectAbortSignal(abortSignal?: AbortSignal): void {
    const abortController = this.#abortController;
    if (!abortSignal) {
      return;
    }

    if (abortSignal.aborted) {
      abortController.abort(abortSignal.reason);
    } else {
      abortSignal.addEventListener('abort', () => abortController.abort(abortSignal.reason), {
        once: true,
        signal: abortController.signal,
      });
    }
  }
}
