import { FocusMonitor } from '@angular/cdk/a11y';
import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input, Renderer2 } from '@angular/core';

/**
 * Connects custom header content to an ngx-datatable sortable header.
 *
 * Apply the directive to content within a sortable ngx-datatable header. It monitors the
 * containing header for focus and invokes the supplied callback when the header is clicked or
 * activated with the Space key. (Enter key activation is handled by ngx-datatable)
 */
@Directive({
  selector: '[angHeaderSortTrigger]',
  host: {
    class: 'ang-table--header-sort-trigger',
  },
})
export class HeaderSortTrigger {
  /** Callback invoked when the containing sortable header is activated. */
  readonly sortFn = input.required<() => void>({ alias: 'angHeaderSortTrigger' });

  /** Element carrying the directive. */
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Renderer used to register platform-safe event listeners. */
  readonly #renderer = inject(Renderer2);

  /** Focus monitor used to apply focus-origin classes to the sortable header. */
  readonly #focusMonitor = inject(FocusMonitor);

  /** Destruction lifecycle used to remove listeners and focus monitoring. */
  readonly #destroyRef = inject(DestroyRef);

  /** Initializes focus monitoring and activation listeners after the host has rendered. */
  constructor() {
    afterNextRender(() => {
      const el = this.#element.nativeElement;
      const sortableEl = el.closest<HTMLElement>('.datatable-header-cell.sortable');

      if (!sortableEl) {
        return;
      }

      this.#attachFocusMonitor(sortableEl);
      this.#attachListeners(sortableEl);
    });
  }

  /**
   * Registers mouse and keyboard activation listeners on the sortable header.
   *
   * @param el Sortable ngx-datatable header element.
   */
  #attachListeners(el: HTMLElement): void {
    const listener = () => this.sortFn()();
    const cleanup: (() => void)[] = [];
    cleanup.push(this.#renderer.listen(el, 'click', listener));
    cleanup.push(this.#renderer.listen(el, 'keydown.space', listener));

    this.#destroyRef.onDestroy(() => cleanup.forEach((fn) => fn()));
  }

  /**
   * Monitors focus origin on the sortable header until the directive is destroyed.
   *
   * @param el Sortable ngx-datatable header element.
   */
  #attachFocusMonitor(el: HTMLElement): void {
    this.#focusMonitor.monitor(el, true);
    this.#destroyRef.onDestroy(() => this.#focusMonitor.stopMonitoring(el));
  }
}
