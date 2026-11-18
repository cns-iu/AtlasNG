import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';

/**
 * Measures an ngx-datatable for the table's sticky header.
 *
 * ngx-datatable's header sticks to the top of the table's own scroller, `.datatable-grid`, but
 * that scroller also scrolls sideways, which keeps the header from sticking to any ancestor.
 * The table's styles instead move the header with a scroll-driven animation while a scrolling
 * ancestor, such as the page, scrolls the top of the table out of view. The animation runs in
 * step with scrolling, but how far it moves the header depends on the heights of the grid and
 * the header, which this directive exposes on the grid as CSS variables whenever they change.
 */
@Directive({
  selector: '[angStickyHeader]',
})
export class StickyHeader {
  /** Datatable element carrying the directive. */
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Renderer used to write the CSS variables. */
  readonly #renderer = inject(Renderer2);

  /** Destruction lifecycle used to disconnect the resize observer. */
  readonly #destroyRef = inject(DestroyRef);

  /** Starts measuring once the datatable has rendered its grid and header. */
  constructor() {
    afterNextRender(() => {
      const grid = this.#element.nativeElement.querySelector<HTMLElement>('.datatable-grid');
      const header = grid?.querySelector<HTMLElement>('datatable-header');
      if (!grid || !header) {
        return;
      }

      const observer = new ResizeObserver(() => {
        this.#setVariable(grid, '--_ang-table-grid-height', grid.getBoundingClientRect().height);
        this.#setVariable(grid, '--_ang-table-header-height', header.getBoundingClientRect().height);
      });
      observer.observe(grid);
      observer.observe(header);
      this.#destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /**
   * Writes a length in pixels to a CSS variable.
   *
   * @param element Element to write the variable to.
   * @param name Name of the CSS variable.
   * @param value Length in pixels.
   */
  #setVariable(element: HTMLElement, name: string, value: number): void {
    this.#renderer.setStyle(element, name, `${value}px`, RendererStyleFlags2.DashCase);
  }
}
