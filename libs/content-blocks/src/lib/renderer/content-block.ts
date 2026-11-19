import { isPlatformServer } from '@angular/common';
import {
  Directive,
  effect,
  ElementRef,
  ErrorHandler,
  inject,
  input,
  output,
  PendingTasks,
  PLATFORM_ID,
  Renderer2,
  untracked,
} from '@angular/core';
import { ContentDocument } from '@atlasng/content-blocks/types';
import { buildRenderTree } from '../nodes/build-tree';
import { startPipeline } from '../pipeline/pipeline';
import { Boundary } from './boundary';
import { createRenderContext, ContentRenderFailure } from './render-context';

/** Text of the comment that precedes server-rendered content in the host. */
const SERVER_CONTENT_MARKER = 'ang-content-block';

/** `Node.COMMENT_NODE`, without relying on the `Node` global. */
const COMMENT_NODE = 8;

/**
 * Renders a {@link ContentDocument} into its host element.
 *
 * The document's nodes are shown together once every node outside a nested boundary is ready. Nodes whose definition
 * declares a `placeholderComponent` render independently inside an `ang-content-boundary` element, showing the
 * placeholder meanwhile. Changing the document aborts pending loads and replaces the rendered content. Requires
 * `provideContentBlocks`.
 *
 * The host and boundary hosts have `aria-busy="true"` while they load.
 *
 * Each rendering of a document is a `PendingTasks` task until the top level content is shown or fails, so server-side
 * rendering waits for it. On the server, content is shown only once every nested boundary settled too, so the
 * serialized page has no placeholders. A data source settles with its first value, so a streaming loader does not keep
 * the server waiting, but one that never emits does. On the client, server-rendered content is not hydrated: it stays
 * in place, without event listeners, until the client rendered the whole document, nested boundaries included, and is
 * then replaced.
 */
@Directive({
  selector: 'ang-content-block, [angContentBlock]',
  host: { class: 'ang-content-block' },
})
export class ContentBlock {
  /** Document to render. */
  readonly document = input.required<ContentDocument>();
  /**
   * Emits once the document's top level content is shown, for each document. Nested boundaries may still show their
   * placeholders.
   */
  readonly rendered = output<void>();
  /**
   * Emits every failed boundary, the content block's own and nested ones, including failures after rendering and
   * failures to load an error component. The error is also passed to Angular's `ErrorHandler`.
   */
  readonly failed = output<ContentRenderFailure>();

  /** Host element the content is rendered into. */
  readonly #host = inject<ElementRef<Element>>(ElementRef);
  /** Receives the error of every failure. */
  readonly #errorHandler = inject(ErrorHandler);
  /** Keeps the application unstable, e.g. server-side rendering waiting, while a document renders. */
  readonly #pendingTasks = inject(PendingTasks);
  /** Renderer for the server content marker. */
  readonly #renderer = inject(Renderer2);
  /** Whether the content block renders on the server. */
  readonly #isServer = isPlatformServer(inject(PLATFORM_ID));
  /** Whether {@link #prepareHost} ran. */
  #hostPrepared = false;
  /** Shared render context. */
  readonly #context = createRenderContext((failure) => {
    this.#errorHandler.handleError(failure.error);
    this.failed.emit(failure);
  });

  /** Renders the current document and cleans up the previous one. */
  constructor() {
    effect((onCleanup) => {
      const document = this.document();
      const controller = new AbortController();
      const serverNodes = untracked(() => this.#prepareHost());
      const boundary = new Boundary(
        this.#context,
        this.#host.nativeElement,
        {
          kind: 'root',
          content: document.content,
          nodes: () => {
            const nodes = buildRenderTree(document, controller.signal);
            startPipeline(nodes, this.#context);
            return nodes;
          },
        },
        { adoptedNodes: serverNodes, awaitNested: this.#isServer || serverNodes.length > 0 },
      );
      const removeTask = this.#pendingTasks.add();

      onCleanup(() => {
        controller.abort();
        boundary.destroy();
        removeTask();
      });

      untracked(async () => {
        try {
          const result = await boundary.start();
          if (result === 'rendered') {
            this.rendered.emit();
          }
        } finally {
          removeTask();
        }
      });
    });
  }

  /**
   * Prepares the host for the first rendering. On the server, appends a marker comment that precedes the content. On
   * the client, takes the marker and the server-rendered content after it, if any, so the first rendering replaces
   * them. Template children of the host precede the marker and are kept.
   *
   * @returns The server-rendered nodes to replace, including the marker, or none after the first call.
   */
  #prepareHost(): Node[] {
    if (this.#hostPrepared) {
      return [];
    }

    this.#hostPrepared = true;
    const host = this.#host.nativeElement;
    if (this.#isServer) {
      this.#renderer.appendChild(host, this.#renderer.createComment(SERVER_CONTENT_MARKER));
      return [];
    }

    const children = Array.from(host.childNodes);
    const start = children.findIndex(
      (node) => node.nodeType === COMMENT_NODE && (node as Comment).data === SERVER_CONTENT_MARKER,
    );
    return start < 0 ? [] : children.slice(start);
  }
}
