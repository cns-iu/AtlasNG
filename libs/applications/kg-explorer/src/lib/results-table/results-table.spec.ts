import { Component } from '@angular/core';
import type { TableColumn } from '@atlasng/design-system/table';
import { TextCellDefinition } from '@atlasng/design-system/table/columns';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { KgExplorerTableEndSlot } from '../slots';
import { defaultKgExplorerSearch, KgExplorerResultsTable } from './results-table';

interface TestRow {
  title: string;
  tags: string[];
}

const ROWS: TestRow[] = [
  { title: 'Kidney atlas', tags: ['Kidney'] },
  { title: 'Heart atlas', tags: ['Heart'] },
  { title: 'Lung dataset', tags: ['Lung', 'Kidney'] },
];

const COLUMNS: TableColumn<TestRow>[] = [{ name: 'Title', prop: 'title', cellTemplate: TextCellDefinition }];

@Component({
  imports: [KgExplorerResultsTable, KgExplorerTableEndSlot],
  template: `
    <ang-kg-explorer-results-table [rows]="rows" [columns]="columns" [search]="search" [showEndOfResults]="showEnd">
      <ng-template angKgExplorerTableEnd><footer>Table footer</footer></ng-template>
    </ang-kg-explorer-results-table>
  `,
})
class TableEndHost {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  search = '';
  showEnd = true;
}

describe('KgExplorerResultsTable', () => {
  async function setup(inputs: Record<string, unknown> = {}) {
    const user = userEvent.setup();
    const clearResults = vi.fn();
    const result = await render(KgExplorerResultsTable<TestRow>, {
      inputs: { rows: ROWS, columns: COLUMNS, searchLabelFn: (row: TestRow) => row.title, ...inputs },
      on: { clearResults },
    });

    return { ...result, user, clearResults };
  }

  it('shows the results counter and end of results', async () => {
    await setup();

    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Results: 3')).toBeInTheDocument();
    expect(screen.getByText('End of results')).toBeInTheDocument();
  });

  it('filters rows by the search term and updates the counter', async () => {
    const { user } = await setup({ searchLabelFn: undefined });

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'kidney');

    expect(screen.getByText('Viewing 2 of 3')).toBeInTheDocument();
    expect(await screen.findByText('Kidney atlas')).toBeInTheDocument();
    expect(screen.queryByText('Heart atlas')).not.toBeInTheDocument();
  });

  it('suggests matching rows and applies a picked suggestion', async () => {
    const { user } = await setup();

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'atlas');
    expect(await screen.findAllByRole('option')).toHaveLength(2);
    await user.click(screen.getByRole('option', { name: 'Heart atlas' }));

    expect(screen.getByRole('combobox', { name: 'Search' })).toHaveValue('Heart atlas');
    expect(screen.getByText('Viewing 1 of 3')).toBeInTheDocument();
  });

  it('clears the search with the clear button', async () => {
    const { user } = await setup({ search: 'heart' });

    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('combobox', { name: 'Search' })).toHaveValue('');
    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
  });

  it('shows the no results indicator and clears the results from it', async () => {
    const { user, clearResults } = await setup({ search: 'pancreas' });

    expect(screen.queryByText('End of results')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(clearResults).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
  });

  it('hides sections with the boolean inputs', async () => {
    await setup({ showSearch: false, showResultsCounter: false, showEndOfResults: false });

    expect(screen.queryByRole('combobox', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.queryByText('Viewing 3 of 3')).not.toBeInTheDocument();
    expect(screen.queryByText('End of results')).not.toBeInTheDocument();
  });
});

describe('KgExplorerResultsTable table end slot', () => {
  it('renders projected content after the end of results', async () => {
    await render(TableEndHost);

    expect(screen.getByText('End of results')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Table footer');
    expect(screen.getByText('End of results').compareDocumentPosition(screen.getByText('Table footer'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('renders projected content below the no results indicator', async () => {
    await render(TableEndHost, { componentProperties: { search: 'pancreas' } });

    expect(await screen.findByText('No results. Adjust filters or search again.')).toBeInTheDocument();
    expect(screen.getByText('Table footer')).toBeInTheDocument();
  });

  it('renders projected content without the end of results indicator', async () => {
    await render(TableEndHost, { componentProperties: { showEnd: false } });

    expect(screen.queryByText('End of results')).not.toBeInTheDocument();
    expect(screen.getByText('Table footer')).toBeInTheDocument();
  });
});

describe('defaultKgExplorerSearch', () => {
  it('matches string, number, and array values', () => {
    expect(defaultKgExplorerSearch({ title: 'Kidney atlas' }, 'kidney')).toBe(true);
    expect(defaultKgExplorerSearch({ count: 1234 }, '123')).toBe(true);
    expect(defaultKgExplorerSearch({ tags: ['Lung'] }, 'lung')).toBe(true);
    expect(defaultKgExplorerSearch({ meta: { title: 'Kidney' } }, 'kidney')).toBe(false);
  });
});
