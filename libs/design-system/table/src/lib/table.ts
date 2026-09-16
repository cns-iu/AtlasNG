import {
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  TemplateRef,
  Type,
  ViewEncapsulation,
} from '@angular/core';
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
  TABLE,
  TableTemplateDefinition,
} from './definitions/template-definition';
import { TemplateDefinitionCache } from './definitions/template-definition-cache';

/** Visual treatments supported by the AtlasNG table. */
export type TableAppearance = 'striped' | 'grid' | 'vertical-rules' | 'none';

/**
 * Public table column with support for native and reusable definition templates.
 *
 * @typeParam TRow Row rendered by the column.
 */
export type TableColumn<TRow extends Row = Row> = Simplify<
  Omit<NgxTableColumn<TRow>, 'cellTemplate' | 'headerTemplate'> & {
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
  }
>;

/** Default row height used by the virtualized table. */
export const TABLE_ROW_HEIGHT = 48;

/**
 * AtlasNG data table with curated appearance, sorting, selection, reusable
 * templates, and virtualization behavior.
 *
 * @typeParam TRow Row displayed by the table.
 */
@Component({
  selector: 'ang-table',
  imports: [DatatableComponent],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  providers: [{ provide: TABLE, useExisting: forwardRef(() => Table) }],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-table',
    '[class]': '"ang-table--appearance-" + appearance()',
  },
})
export class Table<TRow extends Row = Row> {
  /** Rows displayed by the table. */
  readonly rows = input.required<TRow[]>();

  /** Column definitions displayed by the table. */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** Visual treatment applied to rows and internal rules. */
  readonly appearance = input<TableAppearance>('striped');

  /** Height of each virtualized row in pixels. */
  readonly rowHeight = input(TABLE_ROW_HEIGHT);

  /** Enables horizontal scrolling when columns exceed the available width. */
  readonly scrollbarH = input(true);

  /** Selection behavior; omit to disable selection. */
  readonly selectionType = input<SelectionType>();

  /** Currently selected rows. */
  readonly selected = model<TRow[]>([]);

  /** Sorting behavior. */
  readonly sortType = input<SortType>('single');

  /** Currently applied column sorts. */
  readonly sorts = model<SortPropDir[]>([]);

  /** Columns converted to the native ngx-datatable representation. */
  protected readonly resolvedColumns = computed(() => this.columns().map((column) => this.#resolveColumn(column)));

  /** Reusable body-cell definition instances keyed by column identity. */
  readonly #cellTemplateCache = new TemplateDefinitionCache<CellContext<TRow>, unknown>();

  /** Reusable header-cell definition instances keyed by column identity. */
  readonly #headerTemplateCache = new TemplateDefinitionCache<HeaderCellContext, unknown>();

  /** Initializes automatic cache sweeping after each column-resolution cycle. */
  constructor() {
    effect(() => {
      this.resolvedColumns();
      this.#cellTemplateCache.sweep();
      this.#headerTemplateCache.sweep();
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
    };
  }

  /**
   * Passes native templates through or resolves definition components via a cache.
   *
   * @param column Column containing the requested template and configuration.
   * @param prop Template prefix identifying body-cell or header-cell fields.
   * @param cache Cache responsible for the requested template kind.
   * @returns Resolved native template reference, or undefined when none is configured.
   */
  #resolveColumnTemplate<TContext, TConfig>(
    column: TableColumn<TRow>,
    prop: 'cell' | 'header',
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
