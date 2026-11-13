import { Component } from '@angular/core';
import { provideSearch } from '@atlasng/cdk/search';
import type { TableColumn } from '@atlasng/design-system/table';
import { TextCellDefinition } from '@atlasng/design-system/table/columns';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { KgExplorerTablePanel } from './table-panel';

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
  imports: [KgExplorerTablePanel],
  template: `
    <ang-kg-explorer-table-panel
      [rows]="rows"
      [columns]="columns"
      [search]="search"
      [config]="showEnd ? shown : hidden"
    >
      <footer>Table footer</footer>
    </ang-kg-explorer-table-panel>
  `,
})
class TableEndHost {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  readonly shown = {};
  readonly hidden = { endOfResultsDisabled: true };
  search = '';
  showEnd = true;
}

describe('KgExplorerTablePanel', () => {
  async function setup(inputs: Record<string, unknown> = {}) {
    const user = userEvent.setup();
    const clearResults = vi.fn();
    const result = await render(KgExplorerTablePanel<TestRow>, {
      inputs: { rows: ROWS, columns: COLUMNS, config: { searchSuggestionField: 'title' }, ...inputs },
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
    const { user } = await setup({ config: { searchSuggestionField: 'title', searchSuggestionsDisabled: true } });

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'kidney');

    expect(screen.queryByRole('option')).not.toBeInTheDocument();

    expect(screen.getByText('Viewing 2 of 3')).toBeInTheDocument();
    expect(await screen.findByText('Kidney atlas')).toBeInTheDocument();
    expect(screen.queryByText('Heart atlas')).not.toBeInTheDocument();
  });

  it('searches only the given fields', async () => {
    const { user } = await setup({ config: { searchFields: ['title'] } });

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'kidney');

    expect(screen.getByText('Viewing 1 of 3')).toBeInTheDocument();
  });

  it('shows and suggests only rows that pass the row filter', async () => {
    const { user } = await setup({ rowFilter: (row: TestRow) => row.tags.includes('Heart') });

    expect(screen.getByText('Viewing 1 of 3')).toBeInTheDocument();
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'atlas');

    expect(await screen.findAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Heart atlas' })).toBeInTheDocument();
  });

  it('suggests matching rows and applies a picked suggestion', async () => {
    const { user } = await setup();

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'atlas');
    expect(await screen.findAllByRole('option')).toHaveLength(2);
    await user.click(screen.getByRole('option', { name: 'Heart atlas' }));

    expect(screen.getByRole('combobox', { name: 'Search' })).toHaveValue('Heart atlas');
    expect(screen.getByText('Viewing 1 of 3')).toBeInTheDocument();
  });

  it('limits the suggestions to the configured maximum', async () => {
    const user = userEvent.setup();
    await render(KgExplorerTablePanel<TestRow>, {
      inputs: { rows: ROWS, columns: COLUMNS, config: { searchSuggestionField: 'title' } },
      providers: [provideSearch({ suggestionLimit: 1 })],
    });

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'atlas');

    expect(await screen.findAllByRole('option')).toHaveLength(1);
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
    await setup({ config: { searchDisabled: true, resultsCounterDisabled: true, endOfResultsDisabled: true } });

    expect(screen.queryByRole('combobox', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.queryByText('Viewing 3 of 3')).not.toBeInTheDocument();
    expect(screen.queryByText('End of results')).not.toBeInTheDocument();
  });
});

describe('KgExplorerTablePanel table end slot', () => {
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
