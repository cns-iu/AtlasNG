import { computed, Directive, inject, InjectionToken, viewChild } from '@angular/core';
import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';
import type { Table } from '../table';
import { CellTemplateContext, HeaderCellTemplateContext, TemplateContext } from './template-context';

/** Injection token for the table that owns a template definition. */
export const TABLE = new InjectionToken<Table>('ANG_TABLE');

/** Configuration supplied to the active table template definition. */
export const TABLE_TEMPLATE_DEFINITION_CONFIG = new InjectionToken<unknown>('TABLE_TEMPLATE_DEFINITION_CONFIG');

/**
 * Base class for injectable components that provide table templates.
 *
 * @typeParam TContext Context supplied to the embedded template.
 * @typeParam TConfig Configuration supplied by the owning column.
 */
export abstract class TableTemplateDefinition<TContext, TConfig = void> {
  /** Table that owns this definition instance. */
  readonly table = inject(TABLE);

  /** Cell or header configuration supplied by the owning column. */
  readonly config = inject<TConfig>(TABLE_TEMPLATE_DEFINITION_CONFIG);

  /** Template rendered by ngx-datatable. */
  readonly template = computed(() => this.contextDir().template);

  /** Directive that owns the embedded template exposed by this definition. */
  protected abstract readonly contextDir: () => TemplateContext<TContext>;
}

/**
 * Base class for injectable components that provide body-cell templates.
 *
 * @typeParam TRow Row rendered by the table.
 * @typeParam TConfig Configuration supplied by the owning column.
 */
@Directive()
export abstract class CellDefinition<TRow extends Row = Row, TConfig = void> extends TableTemplateDefinition<
  CellContext<TRow>,
  TConfig
> {
  /** Body-cell context directive declared in the component template. */
  protected override readonly contextDir = viewChild.required<CellTemplateContext<TRow>>(CellTemplateContext);

  /** Type-only value bound to {@link CellTemplateContext.rowType} for row inference. */
  protected readonly rowType = undefined as unknown as TRow;
}

/**
 * Base class for injectable components that provide header-cell templates.
 *
 * @typeParam TConfig Configuration supplied by the owning column.
 */
@Directive()
export abstract class HeaderCellDefinition<TConfig = void> extends TableTemplateDefinition<HeaderCellContext, TConfig> {
  /** Header-cell context directive declared in the component template. */
  protected override readonly contextDir = viewChild.required(HeaderCellTemplateContext);
}
