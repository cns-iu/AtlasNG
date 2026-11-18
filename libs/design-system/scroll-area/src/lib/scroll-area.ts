import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  Component,
  inject,
  input,
  Renderer2,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  NgScrollbar,
  NgScrollbarExt,
  type ScrollbarOrientation,
  type ScrollbarPosition,
  type ScrollbarVisibility,
  ViewportAdapter,
} from 'ngx-scrollbar';
import { ScrollAreaStickyScrollbar } from './scroll-area-sticky-scrollbar/scroll-area-sticky-scrollbar';

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
 *
 * Set `aria-label` or `aria-labelledby` to make the viewport a named, keyboard-focusable
 * `region`, so keyboard users can scroll content that has no focusable elements.
 *
 * Content that already scrolls one of its own elements, such as a data table that virtualizes
 * its rows, can keep that element as the viewport with `externalViewport`. The scroll area then
 * hides that element's native scrollbars and draws its own scrollbar and fades over it.
 *
 * Content taller than the screen, such as a long table in a page that scrolls, can keep its
 * horizontal scrollbar in view with `stickyScrollbar`.
 */
@Component({
  selector: 'ang-scroll-area',
  imports: [NgScrollbar, NgScrollbarExt, NgTemplateOutlet, ScrollAreaStickyScrollbar],
  templateUrl: './scroll-area.html',
  styleUrl: './scroll-area.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-scroll-area',
    '[class.ang-scroll-area--fade-top]': '!disableFade() && canScrollUp()',
    '[class.ang-scroll-area--fade-bottom]': '!disableFade() && canScrollDown()',
    '[class.ang-scroll-area--fade-start]': '!disableFade() && canScrollStart()',
    '[class.ang-scroll-area--fade-end]': '!disableFade() && canScrollEnd()',
    '[class.ang-scroll-area--sticky]': 'stickyScrollbar()',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
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

  /**
   * Selector of an element inside the projected content that scrolls on its own and becomes the
   * viewport, instead of a viewport the scroll area wraps around the content. ngx-scrollbar moves
   * that element's children into a content wrapper (`.ng-scroll-content`) and removes its padding,
   * so style the wrapper for any layout or padding the children need. The element keeps its own
   * role and attributes, so `aria-label` and `aria-labelledby` are ignored. Set it once; changing
   * it recreates the viewport.
   */
  readonly externalViewport = input<string>();

  /**
   * Keeps the horizontal scrollbar at the bottom of the window, or of the nearest scrolling
   * ancestor, while any part of the scroll area is in view, so content taller than the screen
   * shows that it scrolls sideways. The scrollbar stays visible whenever the content can scroll
   * sideways and sits at the bottom edge regardless of `position`. Ancestors up to the scrolling
   * one must not hide or scroll their overflow; use `overflow: clip` to clip them.
   */
  readonly stickyScrollbar = input(false, { transform: booleanAttribute });

  /** Accessible name of the viewport. Makes the viewport a focusable region. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Space-separated ids of elements labelling the viewport. Makes the viewport a focusable region. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Whether the content is scrolled down from the top. */
  protected readonly canScrollUp = signal(false);

  /** Whether the content extends below the bottom of the viewport. */
  protected readonly canScrollDown = signal(false);

  /** Whether the content is scrolled away from its inline start edge. */
  protected readonly canScrollStart = signal(false);

  /** Whether the content extends past the inline end edge of the viewport. */
  protected readonly canScrollEnd = signal(false);

  /** Adapter of the ngx-scrollbar instance that owns the scrolling viewport, shared by both viewport kinds. */
  protected readonly adapter = viewChild.required('scrollbar', { read: ViewportAdapter });

  /**
   * Sets up the scroll listener that keeps the edge fades in sync with the scroll position,
   * and applies the region semantics to the viewport when it is labelled. Both wait for the
   * adapter to initialize, since an external viewport is only attached after the first render.
   */
  constructor() {
    const renderer = inject(Renderer2);

    afterRenderEffect({
      write: () => {
        const adapter = this.adapter();
        if (this.externalViewport() || !adapter.initialized()) {
          return;
        }

        const viewport = adapter.viewportElement;
        const label = this.ariaLabel();
        const labelledby = this.ariaLabelledby();
        const attributes = {
          role: label || labelledby ? 'region' : null,
          tabindex: label || labelledby ? '0' : null,
          'aria-label': label,
          'aria-labelledby': labelledby,
        };
        for (const [name, value] of Object.entries(attributes)) {
          if (value) {
            renderer.setAttribute(viewport, name, value);
          } else {
            renderer.removeAttribute(viewport, name);
          }
        }
      },
    });

    afterRenderEffect({
      write: (onCleanup) => {
        const adapter = this.adapter();
        if (!adapter.initialized()) {
          return;
        }

        const unlisten = renderer.listen(adapter.viewportElement, 'scroll', () => this.updateFades());
        onCleanup(unlisten);
        this.updateFades();
      },
    });
  }

  /** Recomputes which edges have hidden content in both directions. Called on scroll and whenever the viewport or content resizes. */
  protected updateFades(): void {
    const viewport = this.adapter().viewportElement;
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
