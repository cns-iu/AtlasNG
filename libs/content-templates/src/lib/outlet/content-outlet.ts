import { Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';
import { ContentDocument } from '@atlasng/content-templates/types';
import { buildRenderTree } from '../nodes/build-tree';
import { startPipeline } from '../pipeline/pipeline';
import { Boundary } from './boundary';
import { createRenderContext } from './render-context';

/**
 * Renders a {@link ContentDocument} into its host element.
 *
 * The document's nodes are shown together once every node outside a nested boundary is ready. Nodes whose definition
 * declares a `placeholderComponent` render independently inside an `ang-content-boundary` element, showing the
 * placeholder meanwhile. Changing the document aborts pending loads and replaces the rendered content. Requires
 * `provideContentTemplates`.
 */
@Directive({
  selector: 'ang-content-outlet, [angContentOutlet]',
  host: { class: 'ang-content-outlet' },
})
export class ContentOutlet {
  /** Document to render. */
  readonly document = input.required<ContentDocument>();

  /** Host element the content is rendered into. */
  readonly #host = inject<ElementRef<Element>>(ElementRef);
  /** Shared render context. */
  readonly #context = createRenderContext();

  /** Renders the current document and cleans up the previous one. */
  constructor() {
    effect((onCleanup) => {
      const document = this.document();
      const controller = new AbortController();
      const boundary = new Boundary(this.#context, this.#host.nativeElement, {
        kind: 'root',
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
      untracked(() => void boundary.start());
    });
  }
}
