import {
  afterNextRender,
  afterRenderEffect,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
import { RESIZE_OBSERVER } from '@atlasng/core';
import { DatatableComponent, type TableColumn as NgxTableColumn } from '@swimlane/ngx-datatable';
import { columnGridTemplate, contentMeasureTemplate, type ColumnSizing } from './column-widths';

/** Custom property holding the column tracks, which the table's styles apply to the grid. */
const COLUMN_TRACKS_VARIABLE = '--ang-table-column-tracks';

/** Column settings that decide a column's width and its place in the grid. */
type ColumnLayout = ColumnSizing & Pick<NgxTableColumn, 'frozenLeft' | 'frozenRight'>;

/**
 * Orders columns the way ngx-datatable renders them: frozen left, unfrozen,
 * then frozen right.
 *
 * @param columns Columns in input order.
 * @returns Columns in render order.
 */
function inRenderOrder(columns: readonly ColumnLayout[]): ColumnLayout[] {
  return [
    ...columns.filter((column) => column.frozenLeft),
    ...columns.filter((column) => !column.frozenLeft && !column.frozenRight),
    ...columns.filter((column) => !column.frozenLeft && column.frozenRight),
  ];
}

/**
 * Lays out the columns of the ngx-datatable it's applied to with
 * {@link columnGridTemplate}, which, unlike ngx-datatable's flex column mode,
 * honors `maxWidth` and `fitContent`. It measures the width of the scrolling
 * grid and writes the tracks to the `--ang-table-column-tracks` custom
 * property. The columns are laid out again when the grid resizes or the
 * columns or rows change. Until the grid is measured, as during server
 * rendering, ngx-datatable's own tracks apply.
 */
@Directive({
  selector: 'ngx-datatable[angTableColumnLayout]',
})
export class TableColumnLayout {
  /** The ngx-datatable whose columns are laid out. */
  readonly #datatable = inject(DatatableComponent);

  /** The ngx-datatable's host element, which holds the column tracks custom property. */
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Renderer used to write the column tracks. */
  readonly #renderer = inject(Renderer2);

  /** Scrolling grid whose width the columns fill; undefined until rendered. */
  #grid: HTMLElement | undefined;

  /** Width the columns can fill, without the grid's padding; undefined until measured. */
  #availableWidth: number | undefined;

  /** Lays out the columns after each render that changes them or the rows, and whenever the grid resizes. */
  constructor() {
    const ResizeObserver = inject(RESIZE_OBSERVER);
    const destroyRef = inject(DestroyRef);

    // Runs after rendering, so columns that fit their content measure the current rows.
    afterRenderEffect(() => {
      this.#datatable.rows();
      this.#layOut(this.#datatable.columns() ?? []);
    });

    afterNextRender(() => {
      const grid = this.#host.querySelector<HTMLElement>('.datatable-grid');
      if (!ResizeObserver || !grid) {
        return;
      }

      this.#grid = grid;
      // Laying out in the callback, before the browser paints, keeps the columns from flickering.
      const observer = new ResizeObserver(([entry]) => {
        this.#availableWidth = entry.contentBoxSize[0].inlineSize;
        this.#layOut(this.#datatable.columns() ?? []);
      });
      observer.observe(grid);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /**
   * Writes the column tracks for the measured width. Columns that fit their
   * content are first laid out at their `max-content` width and read back from
   * the grid.
   *
   * @param columns Columns in input order.
   */
  #layOut(columns: readonly ColumnLayout[]): void {
    const grid = this.#grid;
    if (this.#availableWidth === undefined || !grid) {
      return;
    }

    const ordered = inRenderOrder(columns);
    let contentWidths: number[] = [];
    if (ordered.some((column) => column.fitContent)) {
      this.#setTracks(contentMeasureTemplate(ordered));
      contentWidths = getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat);
    }

    this.#setTracks(columnGridTemplate(ordered, this.#availableWidth, contentWidths));
  }

  /**
   * Sets the custom property holding the column tracks.
   *
   * @param tracks `grid-template-columns` value.
   */
  #setTracks(tracks: string): void {
    this.#renderer.setStyle(this.#host, COLUMN_TRACKS_VARIABLE, tracks, RendererStyleFlags2.DashCase);
  }
}
