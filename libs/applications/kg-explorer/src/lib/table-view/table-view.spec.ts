import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { Component, type Provider } from '@angular/core';
import { CSV_FILE_FORMAT, JSON_FILE_FORMAT } from '@atlasng/design-system/version-control';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject } from 'rxjs';
import { provideKgExplorerTableView } from '../config';
import {
  KG_EXPLORER_SAMPLE_COLUMNS,
  KG_EXPLORER_SAMPLE_FILTERS,
  KG_EXPLORER_SAMPLE_ITEMS,
  kgExplorerSampleFormats,
  type KgExplorerSampleItem,
} from '../sample-data';
import { KgExplorerTableView } from './table-view';

@Component({
  imports: [KgExplorerTableView],
  template: `
    <ang-kg-explorer-table-view [items]="items" [columns]="columns">
      <p>Custom table footer</p>
    </ang-kg-explorer-table-view>
  `,
})
class SlotHost {
  readonly items = KG_EXPLORER_SAMPLE_ITEMS.slice(0, 3);
  readonly columns = KG_EXPLORER_SAMPLE_COLUMNS;
}

describe('KgExplorerTableView', () => {
  async function setup(inputs: Record<string, unknown> = {}, docked = true, providers: Provider[] = []) {
    const user = userEvent.setup();
    const download = vi.fn();
    const state = new BehaviorSubject<BreakpointState>({ matches: docked, breakpoints: {} });
    const result = await render(KgExplorerTableView<KgExplorerSampleItem>, {
      inputs: {
        items: KG_EXPLORER_SAMPLE_ITEMS.slice(0, 3),
        columns: KG_EXPLORER_SAMPLE_COLUMNS,
        config: { downloadFormats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT] },
        filters: KG_EXPLORER_SAMPLE_FILTERS,
        ...inputs,
      },
      on: { download },
      providers: [{ provide: BreakpointObserver, useValue: { observe: () => state } }, ...providers],
    });

    return { ...result, user, download, state };
  }

  it('renders the filter menu and the results table', async () => {
    await setup();

    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: KG_EXPLORER_SAMPLE_ITEMS[0].title })).toHaveAttribute(
      'href',
      KG_EXPLORER_SAMPLE_ITEMS[0].url,
    );
  });

  it('emits a download request for the picked row and format', async () => {
    const { user, download } = await setup();

    const [button] = await screen.findAllByRole('button', { name: 'Choose download format' });
    await user.click(button);
    await user.click(await screen.findByRole('menuitem', { name: new RegExp(CSV_FILE_FORMAT.label) }));

    expect(download).toHaveBeenCalledWith({ item: KG_EXPLORER_SAMPLE_ITEMS[0], format: CSV_FILE_FORMAT });
  });

  it('has no download column without download formats', async () => {
    await setup({ config: {} });

    expect(await screen.findByRole('link', { name: KG_EXPLORER_SAMPLE_ITEMS[0].title })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('offers the download formats of each row', async () => {
    const { user, download } = await setup({ config: { downloadFormats: kgExplorerSampleFormats } });

    expect(await screen.findByRole('button', { name: 'Choose download format' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No downloads available' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Download ${CSV_FILE_FORMAT.label}` }));

    expect(download).toHaveBeenCalledWith({ item: KG_EXPLORER_SAMPLE_ITEMS[1], format: CSV_FILE_FORMAT });
  });

  it('uses the provided configuration as defaults', async () => {
    await setup({}, true, [provideKgExplorerTableView({ resultsCounterDisabled: true, searchDisabled: true })]);

    expect(screen.queryByText('Viewing 3 of 3')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('merges the config input over the provided configuration', async () => {
    await setup({ config: { resultsCounterDisabled: false, searchDisabled: undefined } }, true, [
      provideKgExplorerTableView({ resultsCounterDisabled: true, searchDisabled: true }),
    ]);

    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('suggests row titles and disables suggestions through the config', async () => {
    const { user, rerender } = await setup();
    const search = screen.getByRole('combobox', { name: 'Search' });

    await user.type(search, 'lorem');
    expect((await screen.findAllByRole('option')).length).toBeGreaterThan(0);

    await rerender({ inputs: { config: { searchSuggestionsDisabled: true } }, partialUpdate: true });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders a multi-select filter for each filter', async () => {
    await setup();

    expect(await screen.findByRole('button', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Organ' })).toBeVisible();
  });

  it('shows the selected options of each filter as chips', async () => {
    const dataset = { label: KG_EXPLORER_SAMPLE_ITEMS[0].type };
    await setup({ filterSelections: { type: [dataset] } });

    const chips = await screen.findByRole('list', { name: 'Active filters' });
    expect(within(chips).getByText(dataset.label)).toBeInTheDocument();
  });

  it('updates the filter selections when a chip is removed', async () => {
    const dataset = { label: KG_EXPLORER_SAMPLE_ITEMS[0].type };
    const { user, fixture } = await setup({ filterSelections: { type: [dataset] } });

    await user.click(await screen.findByRole('button', { name: `Remove ${dataset.label}` }));

    expect(fixture.componentInstance.filterSelections()).toEqual({ type: [] });
  });

  it('resets the filter selections when the results are cleared', async () => {
    const dataset = { label: KG_EXPLORER_SAMPLE_ITEMS[0].type };
    const { user, fixture } = await setup({
      items: [],
      filterSelections: { type: [dataset] },
    });

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(fixture.componentInstance.filterSelections()).toEqual({});
  });

  it('shows only the rows that match the filter selections', async () => {
    const [first, second] = KG_EXPLORER_SAMPLE_ITEMS;
    const { rerender } = await setup({ filterSelections: { type: [{ label: first.type }] } });

    expect(screen.getByText('Viewing 1 of 3')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: first.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: second.title })).not.toBeInTheDocument();

    await rerender({ inputs: { filterSelections: {} }, partialUpdate: true });
    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
  });

  it('suggests only rows that match the filter selections', async () => {
    const [first] = KG_EXPLORER_SAMPLE_ITEMS;
    const { user } = await setup({ filterSelections: { type: [{ label: first.type }] } });

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'dolor');

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(first.title);
  });

  it('derives the options of a filter from the items', async () => {
    const { user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Type' }));

    expect(await screen.findByRole('option', { name: new RegExp(KG_EXPLORER_SAMPLE_ITEMS[1].type) })).toBeVisible();
  });

  it('leaves filters without a field to the consumer', async () => {
    await setup({
      filters: [{ id: 'type', label: 'Type', options: [{ label: 'Dataset' }] }],
      filterSelections: { type: [{ label: 'Dataset' }] },
    });

    expect(screen.getByText('Viewing 3 of 3')).toBeInTheDocument();
  });

  it('opens the filter drawer through the filtersOpen model below the large breakpoint', async () => {
    const { rerender, fixture } = await setup({}, false);
    expect(fixture.componentInstance.filtersOpen()).toBe(false);

    await rerender({ inputs: { filtersOpen: true }, partialUpdate: true });

    expect(await screen.findByRole('button', { name: 'Type' })).toBeVisible();
  });

  it('syncs filtersOpen with the docked state when the breakpoint changes', async () => {
    const { fixture, state } = await setup({}, false);
    expect(fixture.componentInstance.filtersOpen()).toBe(false);

    state.next({ matches: true, breakpoints: {} });
    fixture.detectChanges();
    expect(fixture.componentInstance.filtersOpen()).toBe(true);

    state.next({ matches: false, breakpoints: {} });
    fixture.detectChanges();
    expect(fixture.componentInstance.filtersOpen()).toBe(false);
  });

  it('opens the filter menu when it starts docked', async () => {
    const { fixture } = await setup();

    expect(fixture.componentInstance.filtersOpen()).toBe(true);
  });

  it('keeps an initially open drawer open below the large breakpoint', async () => {
    const { fixture } = await setup({ filtersOpen: true }, false);

    expect(fixture.componentInstance.filtersOpen()).toBe(true);
  });

  it('clears the search from the no results indicator', async () => {
    const { user, fixture } = await setup({ search: 'no matching digital object' });

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(fixture.componentInstance.search()).toBe('');
  });

  it('renders projected content at the end of the table', async () => {
    await render(SlotHost);

    expect(screen.getByText('Custom table footer')).toBeInTheDocument();
  });
});
