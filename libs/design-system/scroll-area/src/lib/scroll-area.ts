import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  Renderer2,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  NgScrollbar,
  type ScrollbarOrientation,
  type ScrollbarPosition,
  type ScrollbarVisibility,
} from 'ngx-scrollbar';

export type { ScrollbarOrientation, ScrollbarPosition, ScrollbarVisibility };

/** Distance in pixels from an edge within which the content counts as scrolled to that edge. */
const EDGE_THRESHOLD = 1;

/**
 * Scroll container that replaces native scrollbars with a thin overlay scrollbar.
 *
 * Built on `ngx-scrollbar`. By default the scrollbar is hidden and fades in while the
 * container is hovered, focused, or scrolled, and it overlays the content instead of
 * reserving space for itself. Constrain the size of the host (for example with `height`
 * or `max-height`) so that its projected content can overflow and scroll.
 *
 * When the content can scroll further up or down, a fade in the container color covers
 * that edge. The fade is removed once the content is scrolled all the way to the edge.
 */
@Component({
  selector: 'ang-scroll-area',
  imports: [NgScrollbar],
  templateUrl: './scroll-area.html',
  styleUrl: './scroll-area.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-scroll-area',
    '[class.ang-scroll-area--fade-top]': 'fade() && canScrollUp()',
    '[class.ang-scroll-area--fade-bottom]': 'fade() && canScrollDown()',
  },
})
export class ScrollArea {
  /** Directions the content can scroll in. `auto` shows a scrollbar for every overflowing direction. */
  readonly orientation = input<ScrollbarOrientation>('auto');

  /** When the scrollbar is shown. `hover` shows it only while the container is hovered or scrolled. */
  readonly visibility = input<ScrollbarVisibility>('hover');

  /** Side of the container each scrollbar is placed on. `native` follows the browser's default placement. */
  readonly position = input<ScrollbarPosition>('native');

  /** Whether to fade the top and bottom edges while there is more content to scroll to in that direction. */
  readonly fade = input(true, { transform: booleanAttribute });

  /** Whether the content is scrolled down from the top. */
  protected readonly canScrollUp = signal(false);

  /** Whether the content extends below the bottom of the viewport. */
  protected readonly canScrollDown = signal(false);

  /** The ngx-scrollbar instance that owns the scrolling viewport. */
  private readonly scrollbar = viewChild.required(NgScrollbar);

  /** Sets up the scroll listener that keeps the edge fades in sync with the scroll position. */
  constructor() {
    const renderer = inject(Renderer2);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const viewport = this.scrollbar().adapter.viewportElement;
      const unlisten = renderer.listen(viewport, 'scroll', () => this.updateFades());
      destroyRef.onDestroy(unlisten);
      this.updateFades();
    });
  }

  /** Recomputes which edges have hidden content. Called on scroll and whenever the viewport or content resizes. */
  protected updateFades(): void {
    const viewport = this.scrollbar().adapter.viewportElement;
    if (!viewport) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    this.canScrollUp.set(scrollTop > EDGE_THRESHOLD);
    this.canScrollDown.set(scrollTop + clientHeight < scrollHeight - EDGE_THRESHOLD);
  }
}
