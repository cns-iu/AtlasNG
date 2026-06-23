import { ComponentInput, render, screen } from '@testing-library/angular';
import { Table, TableColumn, TableRow } from './table';

describe('Table', () => {
  const columns: TableColumn[] = [
    {
      column: 'name',
      label: 'Name',
      sticky: true,
    },
    {
      column: 'symbol',
      label: 'Symbol',
    },
    {
      column: 'weight',
      label: 'Weight',
      numeric: true,
    },
  ];

  const rows: TableRow[] = [
    {
      name: { label: 'Hydrogen', link: 'https://en.wikipedia.org/wiki/Hydrogen' },
      symbol: 'H',
      weight: 1.0079,
    },
    {
      name: { label: 'Helium', link: 'https://en.wikipedia.org/wiki/Helium' },
      symbol: 'He',
      weight: 4.0026,
    },
    {
      name: { label: 'Lithium', link: 'https://en.wikipedia.org/wiki/Lithium' },
      symbol: 'Li',
      weight: 6.941,
    },
  ];

  type SetupOptions = {
    inputs?: ComponentInput<Table<TableRow>>;
  };

  function setup({ inputs = {} }: SetupOptions = {}) {
    return render(Table<TableRow>, {
      inputs: {
        columns,
        rows,
        variant: 'alternating',
        enableSort: true,
        stickyHeader: true,
        totalsFooter: true,
        ...inputs,
      },
    });
  }

  it('renders table headers and row values including linked cells', async () => {
    await setup();

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Symbol' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Weight' })).toBeInTheDocument();

    const hydrogenLink = screen.getByRole('link', { name: 'Hydrogen' });
    expect(hydrogenLink).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Hydrogen');
    expect(hydrogenLink).toHaveAttribute('target', '_blank');

    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('4.0026')).toBeInTheDocument();
  });

  it('renders totals footer with sum for numeric columns only', async () => {
    await setup();

    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('11.9515')).toBeInTheDocument();
  });

  it('does not render totals footer when totalsFooter is disabled', async () => {
    await setup({
      inputs: {
        totalsFooter: false,
      },
    });

    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByText('11.9515')).not.toBeInTheDocument();
  });

  it('applies host class for selected table variant', async () => {
    const { fixture } = await setup({
      inputs: {
        variant: 'basic',
      },
    });

    expect(fixture.nativeElement).toHaveClass('ang-table-variant-basic');
  });

  it('returns total for a numeric column and ignores non-numeric cell values', async () => {
    const mixedRows: TableRow[] = [
      { name: 'Hydrogen', symbol: 'H', weight: 1 },
      { name: { label: 'Helium' }, symbol: 'He', weight: 2 },
      { name: 'Lithium', symbol: 'Li', weight: 3 },
    ];

    const { fixture } = await setup({
      inputs: {
        rows: mixedRows,
      },
    });

    expect(fixture.componentInstance.getTotal('weight')).toBe(6);
    expect(fixture.componentInstance.getTotal('name')).toBe(0);
  });
});
