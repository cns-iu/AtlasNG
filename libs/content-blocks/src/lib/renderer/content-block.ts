import { Directive, effect, ElementRef, ErrorHandler, inject, input, output, untracked } from '@angular/core';
import { ContentDocument } from '@atlasng/content-blocks/types';
import { buildRenderTree } from '../nodes/build-tree';
import { startPipeline } from '../pipeline/pipeline';
import { Boundary } from './boundary';
import { createRenderContext, ContentRenderFailure } from './render-context';

/**
 * Renders a {@link ContentDocument} into its host element.
 *
 * The document's nodes are shown together once every node outside a nested boundary is ready. Nodes whose definition
 * declares a `placeholderComponent` render independently inside an `ang-content-boundary` element, showing the
 * placeholder meanwhile. Changing the document aborts pending loads and replaces the rendered content. Requires
 * `provideContentBlocks`.
 *
 * The host and boundary hosts have `aria-busy="true"` while they load. Server-side rendering and hydration are not
 * supported.
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
      const boundary = new Boundary(this.#context, this.#host.nativeElement, {
        kind: 'root',
        content: document.content,
        nodes: () => {
          const nodes = buildRenderTree(document, controller.signal);
          startPipeline(nodes, this.#context);
          return nodes;
        },
      });

      onCleanup(() => {
        controller.abort();
        boundary.destroy();
      });

      untracked(async () => {
        const result = await boundary.start();
        if (result === 'rendered') {
          this.rendered.emit();
        }
      });
    });
  }
}
