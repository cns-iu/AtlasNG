import {
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
  Renderer2,
  TemplateRef,
  Type,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { provideEventScope } from '@atlasng/analytics';
import {
  CellContext,
  DatatableComponent,
  HeaderCellContext,
  TableColumn as NgxTableColumn,
  Row,
  SelectionType,
  SortPropDir,
  SortType,
} from '@swimlane/ngx-datatable';
import { Simplify } from 'type-fest';
import {
  CellDefinition,
  HeaderCellDefinition,
  SummaryCellDefinition,
  TABLE,
  TableTemplateDefinition,
} from './definitions/template-definition';
import { TemplateDefinitionCache } from './definitions/template-definition-cache';
import { TableColumnLayout } from './layout/column-layout';

/** Visual treatments supported by the AtlasNG table. */
export type TableAppearance = 'striped' | 'grid' | 'vertical-rules' | 'none';

/** Placement of the summary row relative to the body rows. */
export type TableSummaryPosition = 'top' | 'bottom';

/**
 * Public table column with support for native and reusable definition templates.
 */
export type TableColumn<TRow extends Row = Row> = Simplify<
  Omit<NgxTableColumn<TRow>, 'cellTemplate' | 'headerTemplate' | 'summaryTemplate'> & {
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
     * When set, ngx-datatable skips `summaryFunc` for this column.
     */
    summaryTemplate?: TemplateRef<CellContext> | Type<SummaryCellDefinition<unknown>>;
    /**
     * Configuration injected when the summary-cell definition is created.
     * Replace the column object to apply a different configuration.
     */
    summaryConfig?: unknown;
    /**
     * Sizes the column to its widest header or body cell, within `minWidth`
     * and `maxWidth`, instead of sharing the table's width; `flexGrow` and
     * `width` don't apply. The width is measured from the rendered rows when
     * the rows, columns, or table width change, so with a fixed `rowHeight`
     * rows scrolled into view later don't widen the column.
     */
    fitContent?: boolean;
  }
>;

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

/** ARIA attributes forwarded from the table host to the inner `role="table"` element. */
const FORWARDED_ARIA_ATTRIBUTES = ['aria-label', 'aria-labelledby', 'aria-describedby'] as const;

/** Summary row height used when the body row height is not a fixed number. */
const DEFAULT_SUMMARY_HEIGHT = 48;

/**
 * Body row height: a fixed pixel height, `'auto'` to size rows to their
 * content, or a function estimating each row's pixel height.
 *
 * - `'auto'` disables virtualization and renders every row, so rows wrap and
 *   grow to fit their content at any width.
 * - Numbers and functions keep virtualization; rendered rows are exactly the
 *   returned height, so taller content is clipped. Replace the function to
 *   recompute every row height, for example after the table width changes.
 */
export type TableRowHeight<TRow extends Row = Row> = number | 'auto' | ((row: TRow) => number);

/**
 * Coerces a row height attribute, parsing numeric strings while passing
 * `'auto'` and estimator functions through.
 *
 * @param value Bound or static attribute value.
 * @returns Row height accepted by ngx-datatable; `'auto'` when unset.
 */
function rowHeightAttribute<TRow extends Row>(value: unknown): TableRowHeight<TRow> {
  if (value == null || value === '') {
    return 'auto';
  }

  if (value === 'auto' || typeof value === 'function') {
    return value as TableRowHeight<TRow>;
  }

  return numberAttribute(value);
}

/**
 * AtlasNG data table with curated appearance, sorting, selection, reusable
 * templates, and virtualization behavior.
 */
@Component({
  selector: 'ang-table',
  imports: [DatatableComponent, TableColumnLayout],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  providers: [{ provide: TABLE, useExisting: forwardRef(() => Table) }, provideEventScope('table')],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-table',
    '[class]': '"ang-table--appearance-" + appearance()',
    '[class.ang-table--summary-top]': 'summaryRow() && summaryPosition() === "top"',
    '[class.ang-table--summary-bottom]': 'summaryRow() && summaryPosition() === "bottom"',
    '[class.ang-table--auto-row-height]': 'rowHeight() === "auto"',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class Table<TRow extends Row = Row> {
  /** Rows displayed by the table. */
  readonly rows = input.required<TRow[] | null | undefined>();

  /**
   * Column definitions displayed by the table.
   *
   * Columns with a positive `flexGrow`, 1 by default, share the table's width
   * in proportion to it, like flexbox items with a zero basis, and stay
   * between their `minWidth` and `maxWidth`. Columns with `fitContent` hug
   * their widest cell, and columns with `flexGrow: 0` keep their `width`.
   * When the minimum widths don't fit, the table scrolls sideways; when every
   * column is at its maximum, the remaining width goes between the columns.
   */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** Visual treatment applied to rows and internal rules. */
  readonly appearance = input<TableAppearance>('striped');

  /**
   * Body row height in pixels, `'auto'` to fit content, or a per-row estimator.
   * See {@link TableRowHeight} for the virtualization trade-offs.
   */
  readonly rowHeight = input<TableRowHeight<TRow>, unknown>('auto', { transform: rowHeightAttribute });

  /** Enables horizontal scrolling when columns exceed the available width. */
  readonly scrollbarH = input(true, { transform: booleanAttribute });

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

  /** Height of the summary row in pixels; defaults to {@link rowHeight} when it is a number and 48px otherwise. */
  readonly summaryHeight = input(undefined, { transform: optionalNumberAttribute });

  /** Placement of the summary row relative to the body rows. */
  readonly summaryPosition = input<TableSummaryPosition>('top');

  /** Accessible name of the table. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Space-separated ids of elements labelling the table, such as a visible heading. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Space-separated ids of elements describing the table. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  /** Summary row height with the numeric body row height applied as a fallback. */
  protected readonly resolvedSummaryHeight = computed(() => {
    const rowHeight = this.rowHeight();
    return this.summaryHeight() ?? (typeof rowHeight === 'number' ? rowHeight : DEFAULT_SUMMARY_HEIGHT);
  });

  /** Columns converted to the native ngx-datatable representation. */
  protected readonly resolvedColumns = computed(() => this.columns().map((column) => this.#resolveColumn(column)));

  /** Reusable body-cell definition instances keyed by column identity. */
  readonly #cellTemplateCache = new TemplateDefinitionCache<CellContext<TRow>, unknown>();

  /** Reusable header-cell definition instances keyed by column identity. */
  readonly #headerTemplateCache = new TemplateDefinitionCache<HeaderCellContext, unknown>();

  /** Reusable summary-cell definition instances keyed by column identity. */
  readonly #summaryTemplateCache = new TemplateDefinitionCache<CellContext, unknown>();

  /** Host element of the wrapped ngx-datatable, searched for its `role="table"` element. */
  private readonly datatable = viewChild(DatatableComponent, { read: ElementRef<HTMLElement> });

  /** Renderer used to write attributes, so they are also applied during server rendering. */
  readonly #renderer = inject(Renderer2);

  /**
   * Initializes automatic cache sweeping after each column-resolution cycle, and forwards
   * the ARIA inputs to the `role="table"` element, which ngx-datatable offers no inputs for.
   * The forwarding uses an effect rather than a render hook so it also runs on the server.
   */
  constructor() {
    effect(() => {
      const values = [this.ariaLabel(), this.ariaLabelledby(), this.ariaDescribedby()];
      const table = this.datatable()?.nativeElement.querySelector('[role="table"]');
      if (!table) {
        return;
      }
      FORWARDED_ARIA_ATTRIBUTES.forEach((name, index) => {
        const value = values[index];
        if (value) {
          this.#renderer.setAttribute(table, name, value);
        } else {
          this.#renderer.removeAttribute(table, name);
        }
      });
    });

    effect(() => {
      this.resolvedColumns();
      this.#cellTemplateCache.sweep();
      this.#headerTemplateCache.sweep();
      this.#summaryTemplateCache.sweep();
    });
  }

  /**
   * Applies AtlasNG defaults and resolves reusable templates for a column.
   *
   * @param column Public column configuration to resolve.
   * @returns Native ngx-datatable column configuration.
   */
  #resolveColumn(column: TableColumn<TRow>): NgxTableColumn<TRow> {
    return {
      ...column,
      flexGrow: column.flexGrow ?? 1,
      resizeable: column.resizeable ?? false,
      draggable: column.draggable ?? false,
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
