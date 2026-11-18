import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { Component, type Provider } from '@angular/core';
import type { Row, TableColumn } from '@atlasng/design-system/table';
import {
  CSV_FILE_FORMAT,
  JSON_FILE_FORMAT,
  type VersionControlFileFormat,
} from '@atlasng/design-system/version-control';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject } from 'rxjs';
import { provideKgExplorerTableView } from './config';
import type { KgExplorerFilter } from '../models';
import { kgExplorerLinkColumn, kgExplorerTextColumn } from '../utils/columns';
import { KgExplorerTableView } from './table-view';

const counter = (text: string) => screen.queryByText(text, { ignore: '.cdk-visually-hidden' });

interface TestItem extends Row {
  title: string;
  url: string;
  type: string;
  tags: string[];
  formats: VersionControlFileFormat[];
}

const ITEMS: TestItem[] = [
  {
    title: 'Lorem Ipsum Dolor',
    url: 'https://example.com/1',
    type: 'Dataset',
    tags: ['Kidney', 'Lung'],
    formats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
  },
  {
    title: 'Dolor Sit Amet',
    url: 'https://example.com/2',
    type: 'Collection',
    tags: ['Skin'],
    formats: [CSV_FILE_FORMAT],
  },
  { title: 'Lorem Consectetur', url: 'https://example.com/3', type: 'Ontology', tags: [], formats: [] },
];

const COLUMNS: TableColumn<TestItem>[] = [
  kgExplorerLinkColumn('Title', 'url', { labelProp: 'title' }),
  kgExplorerTextColumn('Type', 'type'),
];

const FILTERS: KgExplorerFilter<TestItem>[] = [
  { id: 'type', label: 'Type', field: 'type', disableSearch: true },
  { id: 'organ', label: 'Organ', field: 'tags' },
];

@Component({
  imports: [KgExplorerTableView],
  template: `
    <ang-kg-explorer-table-view [items]="items" [columns]="columns">
      <p>Custom table footer</p>
    </ang-kg-explorer-table-view>
  `,
})
class SlotHost {
  readonly items = ITEMS;
  readonly columns = COLUMNS;
}

describe('KgExplorerTableView', () => {
  async function setup(inputs: Record<string, unknown> = {}, docked = true, providers: Provider[] = []) {
    const user = userEvent.setup();
    const download = vi.fn();
    const state = new BehaviorSubject<BreakpointState>({ matches: docked, breakpoints: {} });
    const observer = { observe: vi.fn(() => state), isMatched: vi.fn(() => state.value.matches) };
    const result = await render(KgExplorerTableView<TestItem>, {
      inputs: {
        items: ITEMS,
        columns: COLUMNS,
        config: { downloadFormats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT] },
        filters: FILTERS,
        ...inputs,
      },
      on: { download },
      providers: [{ provide: BreakpointObserver, useValue: observer }, ...providers],
    });

    return { ...result, user, download, state, observer };
  }

  it('renders the filter menu and the results table', async () => {
    await setup();

    expect(counter('Viewing 3 of 3')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: ITEMS[0].title })).toHaveAttribute('href', ITEMS[0].url);
  });

  it('emits a download request for the picked row and format', async () => {
    const { user, download } = await setup();

    await user.click(await screen.findByRole('button', { name: `Choose download format for ${ITEMS[0].title}` }));
    await user.click(await screen.findByRole('menuitem', { name: new RegExp(CSV_FILE_FORMAT.label) }));

    expect(download).toHaveBeenCalledWith({ item: ITEMS[0], format: CSV_FILE_FORMAT });
  });

  it('has no download column without download formats', async () => {
    await setup({ config: {} });

    expect(await screen.findByRole('link', { name: ITEMS[0].title })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
  });

  it('offers the download formats of each row', async () => {
    const { user, download } = await setup({ config: { downloadFormats: (item: TestItem) => item.formats } });

    expect(
      await screen.findByRole('button', { name: `Choose download format for ${ITEMS[0].title}` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `No downloads available for ${ITEMS[2].title}` })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Download ${CSV_FILE_FORMAT.label} for ${ITEMS[1].title}` }));

    expect(download).toHaveBeenCalledWith({ item: ITEMS[1], format: CSV_FILE_FORMAT });
  });

  it('names the download column header without showing it', async () => {
    await setup();

    const header = await screen.findByRole('columnheader', { name: 'Download' });
    expect(within(header).getByText('Download')).toHaveClass('cdk-visually-hidden');
  });

  it('uses the configured download labels', async () => {
    await setup({
      config: {
        downloadFormats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
        downloadColumnLabel: 'Files',
        downloadLabel: 'type',
      },
    });

    expect(await screen.findByRole('columnheader', { name: 'Files' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Choose download format for ${ITEMS[0].type}` })).toBeInTheDocument();
  });

  it('names the download buttons with a label function', async () => {
    await setup({
      config: {
        downloadFormats: [CSV_FILE_FORMAT, JSON_FILE_FORMAT],
        downloadLabel: (item: TestItem) => `${item.title} (${item.type})`,
      },
    });

    expect(
      await screen.findByRole('button', { name: `Choose download format for ${ITEMS[0].title} (${ITEMS[0].type})` }),
    ).toBeInTheDocument();
  });

  it('uses the provided configuration as defaults', async () => {
    await setup({}, true, [provideKgExplorerTableView({ disableResultsCounter: true, disableSearch: true })]);

    expect(counter('Viewing 3 of 3')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('merges the config input over the provided configuration', async () => {
    await setup({ config: { disableResultsCounter: false, disableSearch: undefined } }, true, [
      provideKgExplorerTableView({ disableResultsCounter: true, disableSearch: true }),
    ]);

    expect(counter('Viewing 3 of 3')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('shows the configured results counter prefix', async () => {
    await setup({ config: { resultsCounterPrefix: 'Showing' } });

    expect(counter('Showing 3 of 3')).toBeInTheDocument();
  });

  it('suggests row titles and disables suggestions through the config', async () => {
    const { user, rerender } = await setup();
    const search = screen.getByRole('combobox', { name: 'Search' });

    await user.type(search, 'lorem');
    expect((await screen.findAllByRole('option')).length).toBeGreaterThan(0);

    await rerender({ inputs: { config: { disableSearchSuggestions: true } }, partialUpdate: true });
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders a multi-select filter for each filter', async () => {
    await setup();

    expect(await screen.findByRole('button', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Organ' })).toBeVisible();
  });

  it('shows the selected options of each filter as chips', async () => {
    const dataset = { label: ITEMS[0].type };
    await setup({ filterSelections: { type: [dataset] } });

    const chips = await screen.findByRole('list', { name: 'Active filters' });
    expect(within(chips).getByText(dataset.label)).toBeInTheDocument();
  });

  it('updates the filter selections when a chip is removed', async () => {
    const dataset = { label: ITEMS[0].type };
    const { user, fixture } = await setup({ filterSelections: { type: [dataset] } });

    await user.click(await screen.findByRole('button', { name: `Remove ${dataset.label}` }));

    expect(fixture.componentInstance.filterSelections()).toEqual({ type: [] });
  });

  it('resets the filter selections when the results are cleared', async () => {
    const dataset = { label: ITEMS[0].type };
    const { user, fixture } = await setup({
      items: [],
      filterSelections: { type: [dataset] },
    });

    const [, noResultsClear] = await screen.findAllByRole('button', { name: 'Clear filters' });
    await user.click(noResultsClear);

    expect(fixture.componentInstance.filterSelections()).toEqual({});
  });

  it('resets the filter selections from the filter drawer', async () => {
    const dataset = { label: ITEMS[0].type };
    const { user, fixture } = await setup({ filterSelections: { type: [dataset] } });

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(fixture.componentInstance.filterSelections()).toEqual({});
  });

  it('shows the drawer content of the config and forwards the view customizations', async () => {
    const resetView = vi.fn();
    const { user, fixture } = await setup({
      config: {
        filtersHeading: 'Explorer',
        viewOptions: [
          { value: 'table', label: 'Table' },
          { value: 'grid', label: 'Grid' },
        ],
      },
      view: 'table',
    });
    fixture.componentInstance.resetView.subscribe(resetView);

    expect(await screen.findByRole('heading', { name: 'Explorer' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(fixture.componentInstance.view()).toBe('grid');

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(resetView).toHaveBeenCalled();
  });

  it('shows only the rows that match the filter selections', async () => {
    const [first, second] = ITEMS;
    const { rerender } = await setup({ filterSelections: { type: [{ label: first.type }] } });

    expect(counter('Viewing 1 of 3')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: first.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: second.title })).not.toBeInTheDocument();

    await rerender({ inputs: { filterSelections: {} }, partialUpdate: true });
    expect(counter('Viewing 3 of 3')).toBeInTheDocument();
  });

  it('suggests only rows that match the filter selections', async () => {
    const [first] = ITEMS;
    const { user } = await setup({ filterSelections: { type: [{ label: first.type }] } });

    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'dolor');

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent(first.title);
  });

  it('derives the options of a filter from the items', async () => {
    const { user } = await setup();

    await user.click(await screen.findByRole('button', { name: 'Type' }));

    expect(await screen.findByRole('option', { name: new RegExp(ITEMS[1].type) })).toBeVisible();
  });

  it('leaves filters without a field to the consumer', async () => {
    await setup({
      filters: [{ id: 'type', label: 'Type', options: [{ label: 'Dataset' }] }],
      filterSelections: { type: [{ label: 'Dataset' }] },
    });

    expect(counter('Viewing 3 of 3')).toBeInTheDocument();
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

  it('docks the filter menu from the large breakpoint by default', async () => {
    const { observer } = await setup();

    expect(observer.observe).toHaveBeenCalledWith(['(min-width: 1280px)']);
  });

  it('docks the filter menu from the configured breakpoint', async () => {
    const { observer, rerender, fixture } = await setup({ config: { filtersDockBreakpoint: 'x-large' } });
    expect(observer.observe).toHaveBeenCalledWith(['(min-width: 1920px)']);

    await rerender({ inputs: { config: { filtersDockBreakpoint: 'medium' } }, partialUpdate: true });
    await fixture.whenStable();
    expect(observer.observe).toHaveBeenCalledWith(['(min-width: 960px)']);
  });

  it('docks the filter menu at every width for a breakpoint starting at zero', async () => {
    const { fixture, observer } = await setup({ config: { filtersDockBreakpoint: 'x-small' } }, false);

    expect(fixture.componentInstance.filtersOpen()).toBe(true);
    expect(observer.observe).not.toHaveBeenCalledWith([expect.stringContaining('min-width')]);
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
