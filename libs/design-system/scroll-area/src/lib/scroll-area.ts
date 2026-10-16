import {
  afterNextRender,
  booleanAttribute,
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

/**
 * Scroll container that replaces native scrollbars with a thin overlay scrollbar.
 *
 * Built on `ngx-scrollbar`. By default the scrollbar is hidden and fades in while the
 * container is hovered, focused, or scrolled, and it overlays the content instead of
 * reserving space for itself. Constrain the size of the host (for example with `height`
 * or `max-height`) so that its projected content can overflow and scroll.
 *
 * When the content can scroll further toward an edge (up, down, or toward the inline start
 * or end), a fade in the container color covers that edge. The fade is removed once the
 * content is scrolled all the way to the edge. Horizontal fades follow the text direction,
 * so in right-to-left layouts the start fade sits on the right.
 */
@Component({
  selector: 'ang-scroll-area',
  imports: [NgScrollbar],
  templateUrl: './scroll-area.html',
  styleUrl: './scroll-area.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-scroll-area',
    '[class.ang-scroll-area--fade-top]': '!disableFade() && canScrollUp()',
    '[class.ang-scroll-area--fade-bottom]': '!disableFade() && canScrollDown()',
    '[class.ang-scroll-area--fade-start]': '!disableFade() && canScrollStart()',
    '[class.ang-scroll-area--fade-end]': '!disableFade() && canScrollEnd()',
  },
})
export class ScrollArea {
  /** Directions the content can scroll in. `auto` shows a scrollbar for every overflowing direction. */
  readonly orientation = input<ScrollbarOrientation>('auto');

  /** When the scrollbar is shown. `hover` shows it only while the container is hovered or scrolled. */
  readonly visibility = input<ScrollbarVisibility>('hover');

  /** Side of the container each scrollbar is placed on. `native` follows the browser's default placement. */
  readonly position = input<ScrollbarPosition>('native');

  /** Whether to disable fade effects. */
  readonly disableFade = input(false, { transform: booleanAttribute });

  /** Distance in pixels from an edge within which the content counts as scrolled to that edge. */
  readonly fadeEdgeThreshold = input(1);

  /** Whether the content is scrolled down from the top. */
  protected readonly canScrollUp = signal(false);

  /** Whether the content extends below the bottom of the viewport. */
  protected readonly canScrollDown = signal(false);

  /** Whether the content is scrolled away from its inline start edge. */
  protected readonly canScrollStart = signal(false);

  /** Whether the content extends past the inline end edge of the viewport. */
  protected readonly canScrollEnd = signal(false);

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

  /** Recomputes which edges have hidden content in both directions. Called on scroll and whenever the viewport or content resizes. */
  protected updateFades(): void {
    const viewport = this.scrollbar().adapter.viewportElement;
    if (!viewport) {
      return;
    }

    const threshold = this.fadeEdgeThreshold();
    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = viewport;
    this.canScrollUp.set(scrollTop > threshold);
    this.canScrollDown.set(scrollTop + clientHeight < scrollHeight - threshold);

    // In right-to-left layouts scrollLeft runs from 0 at the start edge to negative values,
    // so its magnitude is the distance from the inline start in either direction.
    const scrollInline = Math.abs(scrollLeft);
    this.canScrollStart.set(scrollInline > threshold);
    this.canScrollEnd.set(scrollInline + clientWidth < scrollWidth - threshold);
  }
}
