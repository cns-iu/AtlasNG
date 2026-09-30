import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  EnvironmentInjector,
  ErrorHandler,
  inject,
  Injector,
  input,
  Renderer2,
  untracked,
} from '@angular/core';
import { ContentResolver } from '../resolver/resolver';
import { ContentDocument } from '../types/content-document';
import { CONTENT_RENDERER_CONFIG } from './config';
import { ContentBoundary, ContentRenderContext } from './content-view';

/**
 * Renders a {@link ContentDocument}.
 *
 * The document's nodes are shown together once every node outside a nested boundary is ready. Nodes whose definition
 * declares a `placeholder` render independently inside an `ang-content-outlet` element. Changing the document aborts
 * pending loads and replaces the rendered content. Requires `provideContentTemplates`.
 */
@Component({
  selector: 'ang-content-renderer',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-content-renderer' },
})
export class ContentRenderer {
  /** Document to render. */
  readonly document = input.required<ContentDocument>();

  /** Resolves documents. */
  readonly #resolver = inject(ContentResolver);
  /** Host element the content is rendered into. */
  readonly #host = inject<ElementRef<Element>>(ElementRef);
  /** Shared render context. */
  readonly #context: ContentRenderContext = {
    appRef: inject(ApplicationRef),
    environmentInjector: inject(EnvironmentInjector),
    elementInjector: inject(Injector),
    renderer: inject(Renderer2),
    errorHandler: inject(ErrorHandler),
    errorComponent: CONTENT_RENDERER_CONFIG.inject().errorComponent,
  };

  /** Renders the current document and cleans up the previous one. */
  constructor() {
    effect((onCleanup) => {
      const document = this.document();
      const controller = new AbortController();
      const boundary = new ContentBoundary(this.#context, this.#host.nativeElement, {
        kind: 'root',
        resolve: () => this.#resolver.resolve(document, controller.signal),
      });

      onCleanup(() => {
        controller.abort();
        boundary.destroy();
      });
      untracked(() => void boundary.start());
    });
  }
}
