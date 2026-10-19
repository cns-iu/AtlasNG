import { computed, Directive, inject, InjectionToken, TemplateRef, viewChild } from '@angular/core';
import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';
import type { Table } from '../table';
import { CellTemplateContext, HeaderCellTemplateContext, SummaryCellTemplateContext } from './template-context';

/** Injection token for the table that owns a template definition. */
export const TABLE = new InjectionToken<Table>('ANG_TABLE');

/** Configuration supplied to the active table template definition. */
export const TABLE_TEMPLATE_DEFINITION_CONFIG = new InjectionToken<unknown>('TABLE_TEMPLATE_DEFINITION_CONFIG');

/**
 * Base class for injectable components that provide table templates.
 */
export abstract class TableTemplateDefinition<TContext, TConfig = void> {
  /** Table that owns this definition instance. */
  readonly table = inject(TABLE);

  /** Cell or header configuration supplied by the owning column. */
  readonly config = inject<TConfig>(TABLE_TEMPLATE_DEFINITION_CONFIG);

  /** Template rendered by ngx-datatable. */
  abstract readonly template: () => TemplateRef<TContext>;
}

/**
 * Base class for injectable components that provide body-cell templates.
 */
@Directive()
export abstract class CellDefinition<TRow extends Row = Row, TConfig = void> extends TableTemplateDefinition<
  CellContext<TRow>,
  TConfig
> {
  /** Template rendered by ngx-datatable. */
  override readonly template = computed(() => this.contextDir().template);

  /** Type-only value bound to {@link CellTemplateContext.rowType} for row inference. */
  protected readonly rowType = undefined as unknown as TRow;

  /** Body-cell context directive declared in the component template. */
  private readonly contextDir = viewChild.required<CellTemplateContext<TRow>>(CellTemplateContext);
}

/**
 * Base class for injectable components that provide header-cell templates.
 */
@Directive()
export abstract class HeaderCellDefinition<TConfig = void> extends TableTemplateDefinition<HeaderCellContext, TConfig> {
  /** Template rendered by ngx-datatable. */
  override readonly template = computed(() => this.contextDir().template);

  /** Header-cell context directive declared in the component template. */
  private readonly contextDir = viewChild.required(HeaderCellTemplateContext);
}

/**
 * Base class for injectable components that provide summary-cell templates.
 *
 * Note that ngx-datatable does not run a column's `summaryFunc` when the column
 * also has a summary template, so the template's `value` is undefined. Compute
 * aggregates from {@link TableTemplateDefinition.table} rows instead.
 */
@Directive()
export abstract class SummaryCellDefinition<TConfig = void> extends TableTemplateDefinition<CellContext, TConfig> {
  /** Template rendered by ngx-datatable. */
  override readonly template = computed(() => this.contextDir().template);

  /** Summary-cell context directive declared in the component template. */
  private readonly contextDir = viewChild.required(SummaryCellTemplateContext);
}
