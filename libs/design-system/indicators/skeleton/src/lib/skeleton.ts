import { Component, computed, input, numberAttribute } from '@angular/core';

/** Shape of a skeleton placeholder. */
export type SkeletonShape = 'text' | 'circle' | 'rect';

/**
 * Placeholder shape shown while content loads.
 *
 * Size it from the surrounding styles. Text bars fill the host's width and take the height of one line
 * of the surrounding type, so a text skeleton is as tall as the text it stands in for. Circles and
 * rectangles fill the host's width and height. The skeleton is hidden from assistive technology, so mark
 * the loading region with `aria-busy` instead.
 *
 * Use skeletons while a page, or a region with several elements, loads: cards, lists, tables, and charts.
 * Replace each section with its content as soon as its data is ready. Don't use a skeleton:
 *
 * - For content that loads in under a second. It needs no loading state.
 * - For a single control, an inline action, or a background task. Use a progress spinner.
 * - For uploads, downloads, and waits longer than about 10 seconds. Use a progress bar that shows how much
 *   is left.
 * - Together with a spinner for the same content. Use one or the other.
 */
@Component({
  selector: 'ang-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  host: {
    class: 'ang-skeleton',
    'aria-hidden': 'true',
    '[class]': '"ang-skeleton--shape-" + shape()',
  },
})
export class Skeleton {
  /** A line of text, a circle, or a rectangle. */
  readonly shape = input<SkeletonShape>('text');

  /**
   * Number of text lines to stack, for paragraph placeholders. When there is more than one, the last
   * line is shorter. Values below 1 render a single line, and circles and rectangles ignore it.
   */
  readonly lines = input(1, { transform: numberAttribute });

  /** One entry per placeholder to render. */
  protected readonly placeholders = computed(() => {
    const lines = Math.floor(this.lines());
    const count = this.shape() === 'text' && lines > 1 ? lines : 1;
    return Array.from({ length: count }, (_, index) => index);
  });
}
