import {
  afterRenderEffect,
  Component,
  computed,
  inject,
  input,
  Renderer2,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgScrollbar, ViewportAdapter } from 'ngx-scrollbar';

/** Class added to the viewport whose horizontal scrollbar the sticky scrollbar replaces. */
const VIEWPORT_CLASS = 'ang-scroll-area-sticky-scrollbar--viewport';

/**
 * Horizontal scrollbar of a scroll area that sticks to the bottom of the nearest scrolling
 * ancestor while the rest of the scroll area is below it, and replaces the viewport's own
 * horizontal scrollbar. It is visible whenever the viewport can scroll sideways.
 *
 * Its content is as much wider than the scrollbar as the viewport's content is wider than the
 * viewport, so both scroll the same distance, and each follows the other's scroll position.
 * The content's width follows the scrollbar's own width in CSS, so it keeps up while the window
 * resizes. It is hidden from assistive technology, which scrolls the viewport itself.
 */
@Component({
  selector: 'ang-scroll-area-sticky-scrollbar',
  imports: [NgScrollbar],
  templateUrl: './scroll-area-sticky-scrollbar.html',
  styleUrl: './scroll-area-sticky-scrollbar.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-scroll-area-sticky-scrollbar',
    'aria-hidden': 'true',
    '[style.--ang-scroll-area-sticky-scrollbar--overflow.px]': 'overflow()',
  },
})
export class ScrollAreaStickyScrollbar {
  /** Adapter of the scroll area's viewport, which this scrollbar scrolls sideways. */
  readonly viewport = input.required<ViewportAdapter>();

  /** Adapter of this scrollbar's own viewport. */
  private readonly adapter = viewChild.required(ViewportAdapter);

  /** Distance the viewport's content overflows it sideways, added to the width of this scrollbar's content. */
  protected readonly overflow = computed(() => {
    const viewport = this.viewport();
    const contentWidth = viewport.contentDimension().width ?? 0;
    const viewportWidth = viewport.viewportDimension().width ?? 0;
    return Math.max(contentWidth - viewportWidth, 0);
  });

  /** Keeps the horizontal scroll positions of the viewport and this scrollbar in step. */
  constructor() {
    const renderer = inject(Renderer2);

    afterRenderEffect({
      write: (onCleanup) => {
        const viewport = this.viewport();
        const adapter = this.adapter();
        if (!viewport.initialized() || !adapter.initialized()) {
          return;
        }

        const viewportElement = viewport.viewportElement;
        const element = adapter.viewportElement;
        const follow = (source: HTMLElement, target: HTMLElement) => () => {
          // A tolerance keeps fractional offsets from bouncing between the two elements.
          if (Math.abs(target.scrollLeft - source.scrollLeft) > 0.5) {
            target.scrollLeft = source.scrollLeft;
          }
        };

        renderer.addClass(viewportElement, VIEWPORT_CLASS);
        const unlistenViewport = renderer.listen(viewportElement, 'scroll', follow(viewportElement, element));
        const unlisten = renderer.listen(element, 'scroll', follow(element, viewportElement));
        follow(viewportElement, element)();
        onCleanup(() => {
          unlistenViewport();
          unlisten();
          renderer.removeClass(viewportElement, VIEWPORT_CLASS);
        });
      },
    });
  }
}
