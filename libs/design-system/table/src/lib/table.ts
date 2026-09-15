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
  TableColumnTemplateFields,
  TableTemplateDefinition,
} from './definitions/template-definition';
import { TemplateDefinitionCache } from './definitions/template-definition-cache';

export type TableColumn<TRow extends Row = Row, TCellConfig = void, THeaderConfig = void> = Simplify<
  Omit<NgxTableColumn<TRow>, 'cellTemplate' | 'headerTemplate'>
> &
  TableColumnTemplateFields<'cell', CellDefinition<TRow, TCellConfig>> &
  TableColumnTemplateFields<'header', HeaderCellDefinition<THeaderConfig>>;

/** Default row height used by the virtualized table. */
export const TABLE_ROW_HEIGHT = 48;

/**
 * AtlasNG data table with curated sorting, selection, loading, summary, and
 * virtualization behavior.
 */
@Component({
  selector: 'ang-table',
  imports: [DatatableComponent],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  providers: [{ provide: TABLE, useExisting: forwardRef(() => Table) }],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ang-table' },
})
export class Table<TRow extends Row = Row, TCellConfig = void, THeaderConfig = void> {
  /** Rows displayed by the table. */
  readonly rows = input.required<TRow[]>();

  /** Column definitions displayed by the table. */
  readonly columns = input.required<TableColumn<TRow, TCellConfig, THeaderConfig>[]>();

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

  readonly #cellTemplateCache = new TemplateDefinitionCache<CellContext<TRow>, TCellConfig>();

  readonly #headerTemplateCache = new TemplateDefinitionCache<HeaderCellContext, THeaderConfig>();

  constructor() {
    effect(() => {
      this.resolvedColumns();
      this.#cellTemplateCache.sweep();
      this.#headerTemplateCache.sweep();
    });
  }

  #resolveColumn(column: TableColumn<TRow, TCellConfig, THeaderConfig>): NgxTableColumn<TRow> {
    return {
      ...column,
      resizeable: column.resizeable ?? false,
      draggable: column.draggable ?? false,
      cellTemplate: this.#resolveColumnTemplate(column, 'cell', this.#cellTemplateCache),
      headerTemplate: this.#resolveColumnTemplate(column, 'header', this.#headerTemplateCache),
    };
  }

  #resolveColumnTemplate<TContext, TConfig>(
    column: TableColumn<TRow, TCellConfig, THeaderConfig>,
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
