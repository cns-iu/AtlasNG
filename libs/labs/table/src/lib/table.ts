import { ChangeDetectionStrategy, Component, computed, effect, input, viewChild } from '@angular/core';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TextLink } from '@atlasng/design-system/text-link';

export type TableVariant = 'alternating' | 'divider' | 'basic';

export type TableRow = Record<string, string | number | TableCell>;

export type TableCell = {
  label: string | number;
  link?: string;
};

export interface TableColumn {
  column: string;
  label: string;
  sticky?: boolean;
  numeric?: boolean;
}

@Component({
  selector: 'ang-table',
  imports: [MatTableModule, MatSortModule, TextLink],
  templateUrl: './table.html',
  styleUrl: './table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"ang-table-variant-" + variant()',
  },
})
export class Table<T = TableRow> {
  /** Table data source */
  protected readonly dataSource = new MatTableDataSource<T>([]);

  /** Table variant */
  readonly variant = input<TableVariant>('alternating');

  /** Table data rows */
  readonly rows = input<T[]>([]);

  /** Columns in table */
  readonly columns = input<TableColumn[]>([]);

  /** Enables sorting */
  readonly enableSort = input<boolean>(false);

  readonly stickyHeader = input<boolean>(true);

  readonly totalsFooter = input<boolean>(true);

  readonly columnIds = computed(() => this.columns().map((col) => col.column));

  /** Mat sort element */
  private readonly sort = viewChild.required(MatSort);

  /** Sort data on load and set columns */
  constructor() {
    effect(() => {
      this.dataSource.data = this.rows();
    });

    effect(() => {
      this.dataSource.sort = this.sort();
    });
  }

  getTotal(col: string): number {
    return this.rows()
      .map((row) => row[col as keyof typeof row])
      .reduce((acc, value) => acc + (typeof value === 'number' ? value : 0), 0);
  }
}
