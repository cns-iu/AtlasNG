import { signal, type WritableSignal } from '@angular/core';
import {
  LinkHandler,
  provideLinkHandler,
  type LinkCommand,
  type PreparedLink,
  withCustomHandler,
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
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { Row, SelectionType, SortPropDir } from '@swimlane/ngx-datatable';
import { Table, type TableAppearance, type TableColumn } from './table';

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

  it('resolves an empty code-cell scaffold without exposing its value', async () => {
    await setup([
      {
        name: 'Code',
        prop: 'code',
        cellTemplate: CodeCellDefinition,
        ...textHeader(),
      },
    ]);

    expect(screen.queryByText('ada')).not.toBeInTheDocument();
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
});
