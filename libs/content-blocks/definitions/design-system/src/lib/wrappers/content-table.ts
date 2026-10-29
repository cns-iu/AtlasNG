import { Component, computed, input, Type } from '@angular/core';
import {
  CellDefinition,
  Row,
  Table,
  TABLE_ROW_HEIGHT,
  TableAppearance,
  TableColumn,
} from '@atlasng/design-system/table';
import {
  ChipCellDefinition,
  CodeCellDefinition,
  LinkCellDefinition,
  LinkCellConfig,
  NumberCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
} from '@atlasng/design-system/table/columns';
import { ContentTableColumn, ContentTableColumnType } from '../schemas';

/** Cell definition rendering each {@link ContentTableColumnType}. */
const CELL_DEFINITIONS: Record<ContentTableColumnType, Type<CellDefinition<Row, unknown>>> = {
  text: TextCellDefinition,
  number: NumberCellDefinition,
  code: CodeCellDefinition,
  chip: ChipCellDefinition,
  link: LinkCellDefinition,
};

/**
 * Converts a JSON column into a design-system table column.
 *
 * @param column The JSON column.
 * @returns The table column, rendered with the cell and header definitions from `@atlasng/design-system/table/columns`.
 */
function toTableColumn(column: ContentTableColumn): TableColumn {
  const { prop, name, type = 'text', align = type === 'number' ? 'end' : 'start' } = column;
  const { sortable, minWidth, flexGrow, label, labelProp = prop } = column;
  const linkConfig: LinkCellConfig = label !== undefined ? { label } : { labelProp };
  const cellConfigs: Partial<Record<ContentTableColumnType, unknown>> = { text: { align }, link: linkConfig };

  return {
    prop,
    name,
    sortable,
    minWidth,
    flexGrow,
    cellTemplate: CELL_DEFINITIONS[type],
    cellConfig: cellConfigs[type],
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align },
  };
}

/**
 * Renders a design-system `Table` for a `Table` node. `Table` columns reference cell templates or definition classes,
 * which a JSON document cannot hold, so this wrapper maps JSON column descriptions to the reusable cell definitions.
 * The table is virtualized: give the node a `maxHeight` style to scroll long tables.
 */
@Component({
  selector: 'ang-content-table',
  imports: [Table],
  template: `<ang-table
    class="ang-content-table--table"
    [rows]="rows()"
    [columns]="tableColumns()"
    [appearance]="appearance()"
    [rowHeight]="rowHeight()"
  />`,
  styles: ':host { display: block; } .ang-content-table--table { max-height: inherit; }',
  host: { class: 'ang-content-table' },
})
export class ContentTable {
  /** JSON column descriptions. */
  readonly columns = input.required<ContentTableColumn[]>();

  /** Rows keyed by column `prop`. */
  readonly rows = input<Row[]>([]);

  /** Visual treatment applied to rows and internal rules. */
  readonly appearance = input<TableAppearance>('striped');

  /** Height of each row in pixels. */
  readonly rowHeight = input(TABLE_ROW_HEIGHT);

  /** Columns converted to design-system table columns, recreated only when the JSON columns change. */
  protected readonly tableColumns = computed(() => this.columns().map(toTableColumn));
}
