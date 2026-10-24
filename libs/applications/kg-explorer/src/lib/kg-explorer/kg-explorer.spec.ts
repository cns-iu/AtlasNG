import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { CSV_FILE_FORMAT } from '@atlasng/design-system/version-control';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject } from 'rxjs';
import {
  KG_EXPLORER_SAMPLE_COLUMNS,
  KG_EXPLORER_SAMPLE_ITEMS,
  KG_EXPLORER_SAMPLE_FILTERS,
  KG_EXPLORER_SAMPLE_TYPE_OPTIONS,
  type KgExplorerSampleItem,
} from '../sample-data';
import { KgExplorerTableEndSlot } from '../slots';
import { KgExplorer } from './kg-explorer';

@Component({
  imports: [KgExplorer, KgExplorerTableEndSlot],
  template: `
    <ang-kg-explorer [items]="items" [columns]="columns">
      <ng-template angKgExplorerTableEnd><p>Custom table footer</p></ng-template>
    </ang-kg-explorer>
  `,
})
class SlotHost {
  readonly items = KG_EXPLORER_SAMPLE_ITEMS.slice(0, 3);
  readonly columns = KG_EXPLORER_SAMPLE_COLUMNS;
}

describe('KgExplorer', () => {
  async function setup(inputs: Record<string, unknown> = {}, docked = true) {
    const user = userEvent.setup();
    const download = vi.fn();
    const clearFilters = vi.fn();
    const state = new BehaviorSubject<BreakpointState>({ matches: docked, breakpoints: {} });
    const result = await render(KgExplorer<KgExplorerSampleItem>, {
      inputs: {
        items: KG_EXPLORER_SAMPLE_ITEMS.slice(0, 3),
        columns: KG_EXPLORER_SAMPLE_COLUMNS,
        downloadFormats: [CSV_FILE_FORMAT],
        filters: KG_EXPLORER_SAMPLE_FILTERS,
        ...inputs,
      },
      on: { download, clearFilters },
      providers: [{ provide: BreakpointObserver, useValue: { observe: () => state } }],
    });

    return { ...result, user, download, clearFilters, state };
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

  it('hides the download column with the boolean input', async () => {
    await setup({ showDownload: false });

    expect(screen.queryByRole('button', { name: 'Choose download format' })).not.toBeInTheDocument();
  });

  it('renders a multi-select filter for each filter', async () => {
    await setup();

    expect(await screen.findByRole('button', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Organ' })).toBeVisible();
  });

  it('shows the selected options of each filter as chips', async () => {
    const [dataset] = KG_EXPLORER_SAMPLE_TYPE_OPTIONS;
    await setup({ filterSelections: { type: [dataset] } });

    const chips = await screen.findByRole('list', { name: 'Active filters' });
    expect(within(chips).getByText(dataset.label)).toBeInTheDocument();
  });

  it('updates the filter selections when a chip is removed', async () => {
    const [dataset] = KG_EXPLORER_SAMPLE_TYPE_OPTIONS;
    const { user, fixture } = await setup({ filterSelections: { type: [dataset] } });

    await user.click(await screen.findByRole('button', { name: `Remove ${dataset.label}` }));

    expect(fixture.componentInstance.filterSelections()).toEqual({ type: [] });
  });

  it('resets the filter selections when the results are cleared', async () => {
    const [dataset] = KG_EXPLORER_SAMPLE_TYPE_OPTIONS;
    const { user, fixture, clearFilters } = await setup({
      items: [],
      filterSelections: { type: [dataset] },
    });

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(fixture.componentInstance.filterSelections()).toEqual({});
    expect(clearFilters).toHaveBeenCalledOnce();
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

  it('emits clear filters from the no results indicator', async () => {
    const { user, clearFilters } = await setup({ search: 'no matching digital object' });

    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));

    expect(clearFilters).toHaveBeenCalledTimes(1);
  });

  it('forwards the projected table end template', async () => {
    await render(SlotHost);

    expect(screen.getByText('Custom table footer')).toBeInTheDocument();
  });
});
