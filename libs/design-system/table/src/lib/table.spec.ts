import { Component, signal, ViewEncapsulation, type WritableSignal } from '@angular/core';
import {
  LinkHandler,
  provideLinkHandler,
  withCustomHandler,
  type LinkCommand,
  type PreparedLink,
} from '@atlasng/common';
import { CUSTOM_ELEMENT_REGISTRY } from '@atlasng/core';
import {
  CheckboxCellDefinition,
  CheckboxHeaderCellDefinition,
  CodeCellDefinition,
  LinkCellDefinition,
  NumberCellDefinition,
  TextCellDefinition,
  TextHeaderCellDefinition,
} from '@atlasng/design-system/table/columns';
import type { Row, SelectionType, SortPropDir } from '@swimlane/ngx-datatable';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { SummaryCellTemplateContext } from './definitions/template-context';
import { SummaryCellDefinition } from './definitions/template-definition';
import { Table, type TableAppearance, type TableColumn, type TableSummaryPosition } from './table';

interface TestRow extends Row {
  name: string;
  score: number;
  url: string;
  code: string;
}

class MockLinkHandler implements LinkHandler {
  readonly prepareLink = vi.fn((command: LinkCommand): PreparedLink => ({ href: String(command.command) }));

  readonly navigateTo = vi.fn((): boolean => false);

  readonly isActive = vi.fn(() => signal(false));
}

const ROWS: TestRow[] = [{ name: 'Ada', score: 1234.5, url: '/ada', code: 'ada' }];

@Component({
  selector: 'ang-test-summary-cell-definition',
  imports: [SummaryCellTemplateContext],
  template: `<ng-template angSummaryCellTemplateContext
    >{{ config.label }}: {{ table.rows()?.length ?? 0 }}</ng-template
  >`,
  encapsulation: ViewEncapsulation.None,
})
class TestSummaryCellDefinition extends SummaryCellDefinition<{ label: string }> {}

function textHeader(
  align: 'start' | 'center' | 'end' = 'start',
): Pick<TableColumn<TestRow>, 'headerTemplate' | 'headerConfig'> {
  return {
    headerTemplate: TextHeaderCellDefinition,
    headerConfig: { align },
  };
}

describe('Table', () => {
  async function setup(
    columns: TableColumn<TestRow>[],
    options: {
      appearance?: WritableSignal<TableAppearance>;
      selectionType?: SelectionType;
      sorts?: SortPropDir[];
      summaryRow?: boolean;
      summaryHeight?: number;
      summaryPosition?: TableSummaryPosition;
    } = {},
  ) {
    const appearance = options.appearance ?? signal<TableAppearance>('striped');
    const columnState = signal(columns);
    const sorts = signal<SortPropDir[]>(options.sorts ?? []);
    const sortsChange = vi.fn();
    const handler = new MockLinkHandler();
    const user = userEvent.setup();
    const result = await render(
      `<div style="height: 240px">
        <ang-table
          [appearance]="appearance()"
          [rows]="rows"
          [columns]="columns()"
          [selectionType]="selectionType"
          [sorts]="sorts()"
          [summaryRow]="summaryRow"
          [summaryHeight]="summaryHeight"
          [summaryPosition]="summaryPosition"
          (sortsChange)="sortsChange($event)"
        />
      </div>`,
      {
        imports: [Table],
        componentProperties: {
          appearance,
          columns: columnState,
          rows: ROWS,
          selectionType: options.selectionType,
          sorts,
          sortsChange,
          summaryRow: options.summaryRow ?? false,
          summaryHeight: options.summaryHeight,
          summaryPosition: options.summaryPosition ?? 'top',
        },
        providers: [
          { provide: CUSTOM_ELEMENT_REGISTRY, useValue: { get: vi.fn().mockReturnValue(undefined) } },
          provideLinkHandler(withCustomHandler(() => handler)),
        ],
      },
    );

    return { ...result, appearance, columns: columnState, handler, sorts, sortsChange, user };
  }

  it('defaults to the striped appearance', async () => {
    const { fixture } = await render('<ang-table [rows]="rows" [columns]="columns" />', {
      imports: [Table],
      componentProperties: { columns: [{ name: 'Name', prop: 'name' }], rows: ROWS },
    });

    expect(fixture.nativeElement.querySelector('ang-table')).toHaveClass('ang-table--appearance-striped');
  });

  it('switches appearance classes', async () => {
    const appearance = signal<TableAppearance>('striped');
    const { fixture } = await setup([{ name: 'Name', prop: 'name' }], { appearance });
    const table = fixture.nativeElement.querySelector('ang-table') as HTMLElement;

    expect(table).toHaveClass('ang-table--appearance-striped');

    for (const variant of ['grid', 'vertical-rules', 'none'] as const) {
      appearance.set(variant);
      fixture.detectChanges();
      expect(table).toHaveClass(`ang-table--appearance-${variant}`);
      expect(table).not.toHaveClass('ang-table--appearance-striped');
    }
  });

  it('attaches the full-cell sort trigger only to sortable reusable headers', async () => {
    const { user, sortsChange } = await setup([
      { name: 'Sortable', prop: 'name', ...textHeader('start') },
      { name: 'Static', prop: 'score', sortable: false, ...textHeader('center') },
    ]);
    const sortableHeader = screen.getByRole('columnheader', { name: 'Sortable' });
    const sortable = screen.getByText('Sortable').parentElement;
    const staticHeader = screen.getByText('Static').parentElement;

    expect(sortable).toHaveClass(
      'ang-table--header-sort-trigger',
      'ang-table--text-header',
      'ang-table--text-header-align-start',
    );
    expect(staticHeader).toHaveClass('ang-table--text-header', 'ang-table--text-header-align-center');
    expect(staticHeader).not.toHaveClass('ang-table--header-sort-trigger');

    await user.click(sortableHeader);
    expect(sortsChange).toHaveBeenCalled();
  });

  it('uses a Material arrow icon for unsorted, ascending, and descending states', async () => {
    const columns: TableColumn<TestRow>[] = [{ name: 'Score', prop: 'score', ...textHeader('end') }];
    const { fixture, sorts } = await setup(columns);
    const headerCell = screen.getByRole('columnheader', { name: 'Score' });
    const headerContent = screen.getByText('Score').parentElement;
    const icon = headerContent?.querySelector('mat-icon');

    expect(headerContent).toHaveClass('ang-table--text-header-align-end');
    expect(icon).toHaveClass('mat-icon');
    expect(icon).toHaveAttribute('fonticon', 'arrow_upward_alt');

    expect(headerCell).not.toHaveClass('sort-active', 'sort-asc', 'sort-desc');

    sorts.set([{ prop: 'score', dir: 'asc' }]);
    fixture.detectChanges();
    expect(headerCell).toHaveClass('sort-active', 'sort-asc');
    expect(headerCell).not.toHaveClass('sort-desc');

    sorts.set([{ prop: 'score', dir: 'desc' }]);
    fixture.detectChanges();
    expect(headerCell).toHaveClass('sort-active', 'sort-desc');
    expect(headerCell).not.toHaveClass('sort-asc');
  });

  it('formats number cells with the active locale', async () => {
    await setup([
      {
        name: 'Score',
        prop: 'score',
        cellTemplate: NumberCellDefinition,
        ...textHeader('end'),
      },
    ]);

    expect(screen.getByText('1,234.5')).toHaveClass('ang-table--number-cell');
  });

  it('renders static, property, and function link labels and forwards cell commands', async () => {
    const { handler } = await setup([
      {
        name: 'Static',
        prop: 'url',
        cellTemplate: LinkCellDefinition,
        cellConfig: { label: 'Profile' },
        ...textHeader(),
      },
      {
        name: 'Property',
        prop: 'url',
        cellTemplate: LinkCellDefinition,
        cellConfig: { labelProp: 'name' },
        ...textHeader(),
      },
      {
        name: 'Function',
        prop: 'url',
        cellTemplate: LinkCellDefinition,
        cellConfig: { labelFn: (row: TestRow) => `Open ${row.name}` },
        ...textHeader(),
      },
    ]);

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/ada');
    expect(screen.getByRole('link', { name: 'Ada' })).toHaveAttribute('href', '/ada');
    expect(screen.getByRole('link', { name: 'Open Ada' })).toHaveAttribute('href', '/ada');
    expect(handler.prepareLink).toHaveBeenCalledTimes(3);
    expect(handler.prepareLink).toHaveBeenCalledWith(
      { command: '/ada', preserveFragment: false },
      expect.any(HTMLAnchorElement),
      expect.anything(),
      expect.anything(),
    );
  });

  it('renders code cells with the reusable code definition', async () => {
    await setup([
      {
        name: 'Code',
        prop: 'code',
        cellTemplate: CodeCellDefinition,
        ...textHeader(),
      },
    ]);

    expect(screen.getByText('ada')).toHaveClass('ang-table--code-cell');
  });

  it('renders text cells with the standard reusable definition', async () => {
    await setup([
      {
        name: 'Name',
        prop: 'name',
        cellTemplate: TextCellDefinition,
        ...textHeader(),
      },
    ]);

    expect(screen.getByText('Ada')).toHaveClass('ang-table--text-cell');
  });

  it('renders reusable row and header checkbox definitions', async () => {
    await setup(
      [
        {
          name: 'Select',
          prop: '$select',
          sortable: false,
          cellTemplate: CheckboxCellDefinition,
          headerTemplate: CheckboxHeaderCellDefinition,
        },
      ],
      { selectionType: 'checkbox' },
    );

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
  });

  it('uses the native header when no reusable header is configured', async () => {
    await setup([{ name: 'Native header', prop: 'name' }]);

    expect(screen.getByText('Native header')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Native header' })).not.toBeInTheDocument();
  });

  it('recreates definitions for replacement columns and removes discarded definitions', async () => {
    const column: TableColumn<TestRow> = {
      name: 'Profile',
      prop: 'url',
      cellTemplate: LinkCellDefinition,
      cellConfig: { label: 'Profile' },
      ...textHeader(),
    };
    const { columns, fixture } = await setup([column]);

    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();

    columns.set([{ ...column, cellConfig: { label: 'Details' } }]);
    fixture.detectChanges();
    expect(screen.getByRole('link', { name: 'Details' })).toBeInTheDocument();

    columns.set([
      {
        name: 'Score',
        prop: 'score',
        cellTemplate: NumberCellDefinition,
        ...textHeader('end'),
      },
    ]);
    fixture.detectChanges();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('1,234.5')).toBeInTheDocument();
  });

  describe('summary row', () => {
    function summaryRowElement(container: Element): HTMLElement | null {
      return container.querySelector('datatable-summary-row');
    }

    it('is hidden by default', async () => {
      const { container } = await setup([{ name: 'Score', prop: 'score' }]);

      expect(summaryRowElement(container)).not.toBeInTheDocument();
    });

    it('renders values from the default and custom summary functions', async () => {
      const { container } = await setup(
        [
          { name: 'Name', prop: 'name', summaryFunc: (cells: string[]) => `${cells.length} people` },
          { name: 'Score', prop: 'score' },
          { name: 'Code', prop: 'code', summaryFunc: null },
        ],
        { summaryRow: true },
      );
      const summary = summaryRowElement(container) as HTMLElement;

      expect(summary).toHaveTextContent('1 people');
      expect(summary).toHaveTextContent('1234.5');
      expect(summary).not.toHaveTextContent('ada');
    });

    it('renders native and reusable summary templates', async () => {
      @Component({
        imports: [Table],
        template: `
          <ng-template let-column="column" #total>Total {{ column.name }}</ng-template>
          <ang-table [summaryRow]="true" [rows]="rows" [columns]="columns(total)" />
        `,
      })
      class Host {
        readonly rows = ROWS;

        columns(total: TableColumn<TestRow>['summaryTemplate']): TableColumn<TestRow>[] {
          return [
            { name: 'Score', prop: 'score', summaryTemplate: total },
            {
              name: 'Name',
              prop: 'name',
              summaryTemplate: TestSummaryCellDefinition,
              summaryConfig: { label: 'Rows' },
            },
          ];
        }
      }

      await render(Host);

      expect(screen.getByText('Total Score')).toBeInTheDocument();
      expect(screen.getByText('Rows: 1')).toBeInTheDocument();
    });

    it('applies the requested position and falls back to the row height', async () => {
      const { container, fixture } = await setup([{ name: 'Score', prop: 'score' }], {
        summaryRow: true,
        summaryPosition: 'bottom',
      });
      const table = fixture.nativeElement.querySelector('ang-table') as HTMLElement;
      const row = summaryRowElement(container)?.querySelector('.datatable-body-row');

      expect(table).toHaveClass('ang-table--summary-bottom');
      expect(table).not.toHaveClass('ang-table--summary-top');
      expect(row).toHaveStyle({ height: '48px' });
    });

    it('uses an explicit summary height', async () => {
      const { container } = await setup([{ name: 'Score', prop: 'score' }], {
        summaryRow: true,
        summaryHeight: 32,
      });
      const row = summaryRowElement(container)?.querySelector('.datatable-body-row');

      expect(row).toHaveStyle({ height: '32px' });
    });
  });
});
