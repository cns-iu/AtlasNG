import { inject, InjectionToken, TemplateRef, Type } from '@angular/core';
import type { CellContext, HeaderCellContext, Row } from '@swimlane/ngx-datatable';
import type { Table } from '../table';

type TableColumnTemplateRefFields<TPrefix extends string, TContext, TConfig> = {
  [P in TPrefix as `${P}Template`]?: TemplateRef<TContext>;
} & ([TConfig] extends [void]
  ? { [P in TPrefix as `${P}Config`]?: undefined }
  : { [P in TPrefix as `${P}Config`]?: never });

type TableColumnTemplateDefinitionFields<TPrefix extends string, TDefinition, TConfig> = {
  [P in TPrefix as `${P}Template`]: Type<TDefinition>;
} & ([TConfig] extends [void]
  ? { [P in TPrefix as `${P}Config`]?: TConfig }
  : { [P in TPrefix as `${P}Config`]: TConfig });

export type TableColumnTemplateFields<
  TPrefix extends string,
  TDefinition extends TableTemplateDefinition<unknown, unknown>,
> =
  TDefinition extends TableTemplateDefinition<infer TContext, infer TConfig>
    ? | TableColumnTemplateRefFields<TPrefix, TContext, TConfig>
      | TableColumnTemplateDefinitionFields<TPrefix, TDefinition, TConfig>
    : never;

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
  abstract readonly template: () => TemplateRef<TContext>;
}

/**
 * Base class for injectable components that provide body-cell templates.
 *
 * @typeParam TRow Row rendered by the table.
 * @typeParam TConfig Configuration supplied by the owning column.
 */
export abstract class CellDefinition<TRow extends Row = Row, TConfig = void> extends TableTemplateDefinition<
  CellContext<TRow>,
  TConfig
> {}

/**
 * Base class for injectable components that provide header-cell templates.
 *
 * @typeParam TConfig Configuration supplied by the owning column.
 */
export abstract class HeaderCellDefinition<TConfig = void> extends TableTemplateDefinition<
  HeaderCellContext,
  TConfig
> {}
