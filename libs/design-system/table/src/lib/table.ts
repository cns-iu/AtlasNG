import { CdkMonitorFocus } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  model,
  numberAttribute,
  signal,
  TemplateRef,
  Type,
  viewChild,
  viewChildren,
  ViewEncapsulation,
} from '@angular/core';
import {
  createSortedRowModel,
  injectTable,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type SortingState,
  type Updater,
} from '@tanstack/angular-table';
import { injectVirtualizer, observeElementRect, type Rect, type Virtualizer } from '@tanstack/angular-virtual';
import { Simplify } from 'type-fest';
import {
  CellDefinition,
  HeaderCellDefinition,
  SummaryCellDefinition,
  TABLE,
  TableTemplateDefinition,
} from './definitions/template-definition';
import { TemplateDefinitionCache } from './definitions/template-definition-cache';
import type {
  CellContext,
  HeaderCellContext,
  ResolvedTableColumn,
  Row,
  SelectionType,
  SortDirection,
  SortPropDir,
  SortType,
} from './table-types';

/** Visual treatments supported by the AtlasNG table. */
export type TableAppearance = 'striped' | 'grid' | 'vertical-rules' | 'none';

/** Placement of the summary row relative to the body rows. */
export type TableSummaryPosition = 'top' | 'bottom';

/**
 * Public table column with support for native and reusable definition templates.
 */
export type TableColumn<TRow extends Row = Row> = Simplify<
  Omit<ResolvedTableColumn<TRow>, 'cellTemplate' | 'headerTemplate' | 'summaryTemplate'> & {
    /** Native template or reusable definition used to render body cells. */
    cellTemplate?: TemplateRef<CellContext<TRow>> | Type<CellDefinition<TRow, unknown>>;
    /**
     * Configuration injected when the body-cell definition is created.
     * Replace the column object to apply a different configuration.
     */
    cellConfig?: unknown;
    /** Native template or reusable definition used to render header cells. */
    headerTemplate?: TemplateRef<HeaderCellContext> | Type<HeaderCellDefinition<unknown>>;
    /**
     * Configuration injected when the header-cell definition is created.
     * Replace the column object to apply a different configuration.
     */
    headerConfig?: unknown;
    /**
     * Native template or reusable definition used to render the summary cell.
     * When set, the table skips `summaryFunc` for this column.
     */
    summaryTemplate?: TemplateRef<CellContext> | Type<SummaryCellDefinition<unknown>>;
    /**
     * Configuration injected when the summary-cell definition is created.
     * Replace the column object to apply a different configuration.
     */
    summaryConfig?: unknown;
  }
>;

/** Column resolved for rendering, paired with its TanStack column id. */
interface RenderColumn<TRow extends Row> {
  /** TanStack column id. */
  id: string;
  /** Column with native templates. */
  column: ResolvedTableColumn<TRow>;
}

/** Body row prepared for rendering. */
interface RenderRow<TRow extends Row> {
  /** Stable key used by the virtualizer and `@for`. */
  key: string | number | bigint;
  /** Index in the sorted rows. */
  index: number;
  /** Displayed row. */
  row: TRow;
  /** Whether the row is selected. */
  selected: boolean;
  /** Cell template contexts, one per column. */
  cells: CellContext<TRow>[];
}

/** Features registered with the TanStack table. Only sorting is needed. */
const FEATURES = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });

/**
 * Coerces a number attribute while keeping unset values undefined, unlike
 * `numberAttribute`, which turns them into `NaN`.
 *
 * @param value Bound or static attribute value.
 * @returns Parsed number, or undefined when no value is set.
 */
function optionalNumberAttribute(value: unknown): number | undefined {
  return value == null ? undefined : numberAttribute(value);
}

/**
 * Default comparator: empty values sort last, numbers numerically, everything
 * else as case-insensitive, numeric-aware strings.
 *
 * @param a First value.
 * @param b Second value.
 * @returns Comparison result.
 */
function defaultComparator(a: unknown, b: unknown): number {
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA || emptyB) {
    return Number(emptyA) - Number(emptyB);
  } else if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Finds the closest ancestor that scrolls vertically, ignoring the document root.
 *
 * @param el Element to start from (exclusive).
 * @returns Scrolling ancestor, or undefined when none exists.
 */
function findScrollParent(el: HTMLElement): HTMLElement | undefined {
  const root = el.ownerDocument.documentElement;
  for (let current = el.parentElement; current && current !== root && current !== el.ownerDocument.body;) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return current;
    }
    current = current.parentElement;
  }

  return undefined;
}

/**
 * Observes the scroll element size, substituting the window height while the
 * element has no layout height (for example while hidden, or in jsdom), so that
 * a first batch of rows still renders.
 *
 * @param instance Virtualizer observing the element.
 * @param callback Receives each measured size.
 * @returns Cleanup function stopping the observation.
 */
function observeRectWithFallback(
  instance: Virtualizer<HTMLElement, HTMLElement>,
  callback: (rect: Rect) => void,
): void | (() => void) {
  return observeElementRect(instance, (rect) =>
    callback(rect.height > 0 ? rect : { width: rect.width, height: globalThis.innerHeight ?? 0 }),
  );
}

/** Default estimated and minimum row height in pixels. */
export const TABLE_ROW_HEIGHT = 48;

/**
 * AtlasNG data table with curated appearance, sorting, selection, reusable
 * templates, and virtualized rows whose heights are measured from content.
 *
 * Rows are virtualized against the closest vertically scrolling ancestor, such
 * as an `ang-scroll-area`, or `scrollElement` when set. Without one, the table
 * scrolls itself; constrain its height (for example with `max-height`).
 */
@Component({
  selector: 'ang-table',
  imports: [CdkMonitorFocus, NgTemplateOutlet],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  providers: [{ provide: TABLE, useExisting: forwardRef(() => Table) }],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-table',
    role: 'table',
    '[class]': '"ang-table--appearance-" + appearance()',
    '[class.ang-table--self-scroll]': 'selfScroll()',
    '[class.ang-table--summary-top]': 'summaryRow() && summaryPosition() === "top"',
    '[class.ang-table--summary-bottom]': 'summaryRow() && summaryPosition() === "bottom"',
    '[attr.aria-rowcount]': 'sortedRows().length + 1',
    '[style.--ang-table-columns]': 'gridTemplateColumns()',
    '[style.--ang-table-row-height.px]': 'rowHeight()',
    '[style.--ang-table-summary-height.px]': 'resolvedSummaryHeight()',
  },
})
export class Table<TRow extends Row = Row> {
  /** Rows displayed by the table. */
  readonly rows = input.required<TRow[] | null | undefined>();

  /** Column definitions displayed by the table. */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** Visual treatment applied to rows and internal rules. */
  readonly appearance = input<TableAppearance>('striped');

  /**
   * Estimated and minimum height of each row in pixels. Rows grow to fit their
   * content and are measured after rendering.
   */
  readonly rowHeight = input(TABLE_ROW_HEIGHT, { transform: numberAttribute });

  /** Number of rows rendered above and below the visible range. */
  readonly overscan = input(8, { transform: numberAttribute });

  /** Element whose scrolling drives virtualization; defaults to the closest scrolling ancestor. */
  readonly scrollElement = input<HTMLElement>();

  /** Selection behavior; omit to disable selection. */
  readonly selectionType = input<SelectionType>();

  /** Currently selected rows. */
  readonly selected = model<TRow[]>([]);

  /** Sorting behavior. */
  readonly sortType = input<SortType>('single');

  /** Currently applied column sorts. */
  readonly sorts = model<SortPropDir[]>([]);

  /** Displays a row of per-column summaries computed with each column's `summaryFunc`. */
  readonly summaryRow = input(false, { transform: booleanAttribute });

  /** Minimum height of the summary row in pixels; defaults to {@link rowHeight}. */
  readonly summaryHeight = input(undefined, { transform: optionalNumberAttribute });

  /** Placement of the summary row relative to the body rows. */
  readonly summaryPosition = input<TableSummaryPosition>('top');

  /** Summary row height with the body row height applied as a fallback. */
  protected readonly resolvedSummaryHeight = computed(() => this.summaryHeight() ?? this.rowHeight());

  /** Columns with templates resolved and stable TanStack ids. */
  protected readonly resolvedColumns = computed<RenderColumn<TRow>[]>(() =>
    this.columns().map((column, index, columns) => {
      const unique = column.prop !== undefined && columns.findIndex((other) => other.prop === column.prop) === index;
      return {
        id: unique ? String(column.prop) : `${String(column.prop ?? '')}$${index}`,
        column: this.#resolveColumn(column),
      };
    }),
  );

  /** CSS grid track list shared by the header, body, and summary rows. */
  protected readonly gridTemplateColumns = computed(() =>
    this.resolvedColumns()
      .map(({ column: { width, minWidth, maxWidth, flexGrow = 1 } }) => {
        const min = `${minWidth ?? (flexGrow > 0 ? 0 : (width ?? 150))}px`;
        if (maxWidth !== undefined) {
          return `minmax(${min}, ${maxWidth}px)`;
        }
        return flexGrow > 0 ? `minmax(${min}, ${flexGrow}fr)` : `${width ?? 150}px`;
      })
      .join(' '),
  );

  /** TanStack column definitions derived from the resolved columns. */
  readonly #columnDefs = computed<ColumnDef<typeof FEATURES, TRow>[]>(() =>
    this.resolvedColumns().map(({ id, column }) => {
      const { prop, sortable } = column;
      const comparator = column.comparator ?? defaultComparator;
      return {
        id,
        accessorFn: (row: TRow) => (prop === undefined ? undefined : row[prop]),
        enableSorting: sortable,
        sortDescFirst: false,
        sortFn: (rowA, rowB, columnId) =>
          comparator(rowA.getValue(columnId), rowB.getValue(columnId), rowA.original, rowB.original),
      };
    }),
  );

  /** Sort state converted to TanStack's representation. */
  readonly #sorting = computed<SortingState>(() => {
    const columns = this.resolvedColumns();
    return this.sorts().map(({ prop, dir }) => ({
      id: columns.find(({ column }) => column.prop === prop)?.id ?? String(prop),
      desc: dir === 'desc',
    }));
  });

  /** Headless TanStack table providing the sorted row model and sort toggling. */
  protected readonly table = injectTable<typeof FEATURES, TRow>(() => ({
    features: FEATURES,
    columns: this.#columnDefs(),
    data: this.rows() ?? [],
    state: { sorting: this.#sorting() },
    enableMultiSort: this.sortType() === 'multi',
    isMultiSortEvent: () => this.sortType() === 'multi',
    enableSortingRemoval: true,
    onSortingChange: (updater: Updater<SortingState>) => this.#applySorting(updater),
  }));

  /** Rows in display order. */
  readonly sortedRows = computed(() => {
    this.#sorting();
    this.rows();
    this.#columnDefs();
    return this.table.getRowModel().rows;
  });

  /** Element scrolled by the user; resolved after the first render. */
  readonly #scrollTarget = signal<HTMLElement | undefined>(undefined);

  /** Whether the table scrolls itself because no scrolling ancestor was found. */
  protected readonly selfScroll = signal(false);

  /** Distance from the scroll element's content top to the start of the body rows. */
  readonly #scrollMargin = signal(0);

  /** Table host element. */
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Own scroll viewport, used when no scrolling ancestor exists. */
  private readonly viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');

  /** Container of the body rows; its offset defines the scroll margin. */
  private readonly body = viewChild.required<ElementRef<HTMLElement>>('body');

  /** Rendered body rows, measured by the virtualizer. */
  private readonly rowElements = viewChildren<ElementRef<HTMLElement>>('rowEl');

  /** Virtualizer with dynamic, measured row heights. */
  protected readonly virtualizer = injectVirtualizer<HTMLElement, HTMLElement>(() => ({
    scrollElement: this.#scrollTarget(),
    count: this.sortedRows().length,
    estimateSize: () => this.rowHeight(),
    overscan: this.overscan(),
    scrollMargin: this.#scrollMargin(),
    getItemKey: (index) => this.sortedRows()[index]?.id ?? index,
    observeElementRect: observeRectWithFallback,
  }));

  /** Visible body rows with their cell contexts. */
  protected readonly renderRows = computed<RenderRow<TRow>[]>(() => {
    const rows = this.sortedRows();
    const columns = this.resolvedColumns();
    const selected = new Set(this.selected());
    const disabled = !this.selectionType();

    return this.virtualizer.getVirtualItems().flatMap(({ index, key }) => {
      const tanstackRow = rows[index];
      if (!tanstackRow) {
        return [];
      }
      const row = tanstackRow.original;
      const isSelected = selected.has(row);
      return [
        {
          key,
          index,
          row,
          selected: isSelected,
          cells: columns.map(({ column }) => ({
            row,
            value: this.#cellValue(row, column),
            column,
            rowIndex: index,
            isSelected,
            disabled,
            onCheckboxChangeFn: () => this.toggleRow(row),
          })),
        },
      ];
    });
  });

  /** Offset of the first rendered row relative to the body. */
  protected readonly bodyOffset = computed(() => {
    const first = this.virtualizer.getVirtualItems()[0];
    return first ? first.start - this.virtualizer.options().scrollMargin : 0;
  });

  /** Header cell contexts. */
  protected readonly headerCells = computed(() => {
    this.#sorting();
    const rows = this.rows() ?? [];
    const selectedCount = this.selected().length;
    const allRowsSelected = rows.length > 0 && selectedCount === rows.length;

    return this.resolvedColumns().map(({ id, column }) => {
      const tanstackColumn = this.table.getColumn(id);
      const sorted = tanstackColumn?.getIsSorted();
      const sortDir: SortDirection | undefined = sorted === false ? undefined : sorted;
      const sortable = tanstackColumn?.getCanSort() ?? false;
      const context: HeaderCellContext = {
        column,
        sortDir,
        sortFn: () => tanstackColumn?.toggleSorting(undefined, this.sortType() === 'multi'),
        allRowsSelected,
        selectFn: () => this.selected.set(allRowsSelected ? [] : [...rows]),
      };
      return { id, column, context, sortable, sortDir };
    });
  });

  /** Summary cell contexts. */
  protected readonly summaryCells = computed<CellContext[]>(() => {
    const rows = this.rows() ?? [];
    const columns = this.resolvedColumns();
    const summary: Row = {};
    for (const { column } of columns) {
      const { prop, summaryFunc, summaryTemplate } = column;
      if (prop === undefined || summaryFunc === null || summaryTemplate) {
        continue;
      }
      const cells = rows.map((row) => row[prop]);
      summary[prop] = summaryFunc ? summaryFunc(cells) : this.#defaultSummary(cells);
    }

    return columns.map(({ column }) => ({
      row: summary,
      value: column.prop === undefined ? undefined : summary[column.prop],
      column: column as ResolvedTableColumn,
      rowIndex: -1,
      onCheckboxChangeFn: () => undefined,
    }));
  });

  /** Reusable body-cell definition instances keyed by column identity. */
  readonly #cellTemplateCache = new TemplateDefinitionCache<CellContext<TRow>, unknown>();

  /** Reusable header-cell definition instances keyed by column identity. */
  readonly #headerTemplateCache = new TemplateDefinitionCache<HeaderCellContext, unknown>();

  /** Reusable summary-cell definition instances keyed by column identity. */
  readonly #summaryTemplateCache = new TemplateDefinitionCache<CellContext, unknown>();

  /** Initializes cache sweeping, scroll element resolution, and row measuring. */
  constructor() {
    effect(() => {
      this.resolvedColumns();
      this.#cellTemplateCache.sweep();
      this.#headerTemplateCache.sweep();
      this.#summaryTemplateCache.sweep();
    });

    afterNextRender(() => {
      const target = this.scrollElement() ?? findScrollParent(this.#host.nativeElement);
      this.selfScroll.set(!target);
      this.#scrollTarget.set(target ?? this.viewport().nativeElement);
    });

    // Keep the scroll margin in sync with content above the body, such as the
    // header or content preceding the table in a shared scroll container.
    afterRenderEffect({
      read: () => {
        const scrollEl = this.#scrollTarget();
        if (!scrollEl) {
          return;
        }
        const bodyTop = this.body().nativeElement.getBoundingClientRect().top;
        const margin = bodyTop - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
        if (Math.abs(margin - this.#scrollMargin()) >= 1) {
          this.#scrollMargin.set(margin);
        }
      },
    });

    // Measure rendered rows; the virtualizer keeps a ResizeObserver on each one,
    // so rows re-measure when their content or the table width changes.
    afterRenderEffect({
      read: () => {
        for (const el of this.rowElements()) {
          this.virtualizer.measureElement(el.nativeElement);
        }
      },
    });
  }

  /**
   * Toggles a row's selection according to {@link selectionType}.
   *
   * @param row Row to toggle.
   */
  toggleRow(row: TRow): void {
    const type = this.selectionType();
    if (!type) {
      return;
    }

    const selected = this.selected();
    if (selected.includes(row)) {
      this.selected.set(selected.filter((item) => item !== row));
    } else {
      this.selected.set(type === 'single' ? [row] : [...selected, row]);
    }
  }

  /**
   * Applies a TanStack sorting update to the {@link sorts} model.
   *
   * @param updater New state or a function deriving it from the current state.
   */
  #applySorting(updater: Updater<SortingState>): void {
    const next = typeof updater === 'function' ? updater(this.#sorting()) : updater;
    const props = new Map(this.resolvedColumns().map(({ id, column }) => [id, column.prop ?? id]));
    this.sorts.set(next.map(({ id, desc }) => ({ prop: props.get(id) ?? id, dir: desc ? 'desc' : 'asc' })));
  }

  /**
   * Reads a body-cell value, applying the column pipe like ngx-datatable did.
   *
   * @param row Displayed row.
   * @param column Column of the cell.
   * @returns Cell value passed to the template.
   */
  #cellValue(row: TRow, column: ResolvedTableColumn<TRow>): unknown {
    const value = column.prop === undefined ? undefined : row[column.prop];
    return column.pipe ? column.pipe.transform(value) : value;
  }

  /**
   * Default summary: the sum of numeric cells, or null when there are none.
   *
   * @param cells Column values.
   * @returns Sum or null.
   */
  #defaultSummary(cells: unknown[]): number | null {
    const numbers = cells.filter((cell): cell is number => typeof cell === 'number');
    return numbers.length > 0 ? numbers.reduce((total, value) => total + value, 0) : null;
  }

  /**
   * Resolves reusable templates for a column.
   *
   * @param column Public column configuration to resolve.
   * @returns Column with native templates.
   */
  #resolveColumn(column: TableColumn<TRow>): ResolvedTableColumn<TRow> {
    return {
      ...column,
      sortable: (column.sortable ?? true) && column.prop !== undefined,
      cellTemplate: this.#resolveColumnTemplate(column, 'cell', this.#cellTemplateCache),
      headerTemplate: this.#resolveColumnTemplate(column, 'header', this.#headerTemplateCache),
      summaryTemplate: this.#resolveColumnTemplate(column, 'summary', this.#summaryTemplateCache),
    };
  }

  /**
   * Passes native templates through or resolves definition components via a cache.
   *
   * @param column Column containing the requested template and configuration.
   * @param prop Template prefix identifying body-cell, header-cell, or summary-cell fields.
   * @param cache Cache responsible for the requested template kind.
   * @returns Resolved native template reference, or undefined when none is configured.
   */
  #resolveColumnTemplate<TContext, TConfig>(
    column: TableColumn<TRow>,
    prop: 'cell' | 'header' | 'summary',
    cache: TemplateDefinitionCache<TContext, TConfig>,
  ): TemplateRef<TContext> | undefined {
    const templateOrType = column[`${prop}Template` as const];
    const config = column[`${prop}Config` as const];

    if (!templateOrType || 'createEmbeddedView' in templateOrType) {
      return templateOrType as TemplateRef<TContext> | undefined;
    }

    return cache.getOrCreate(
      column,
      templateOrType as unknown as Type<TableTemplateDefinition<TContext, TConfig>>,
      config as TConfig,
    );
  }
}
