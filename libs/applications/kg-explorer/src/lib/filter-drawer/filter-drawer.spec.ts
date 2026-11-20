import { LOCATION } from '@atlasng/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import type { KgExplorerResolvedFilter, KgExplorerViewSetting } from '../models';
import type { KgExplorerFilterDrawerConfig } from '../table-view/config';
import { KgExplorerFilterDrawer } from './filter-drawer';

const CONFIG: KgExplorerFilterDrawerConfig = {
  filtersLabel: 'Filters',
  clearFiltersLabel: 'Clear filters',
  customizeViewLabel: 'Customize view',
  resetViewLabel: 'Reset',
  viewOptionsLabel: 'View',
};

const FILTERS: KgExplorerResolvedFilter[] = [
  { id: 'type', label: 'Type', options: [{ label: 'Dataset' }, { label: 'Collection' }], disableSearch: true },
  { id: 'organ', label: 'Organ', options: [{ label: 'Kidney' }] },
];

const VIEW_OPTIONS = [
  { value: 'table', label: 'Table' },
  { value: 'grid', label: 'Grid' },
];

const VIEW_SETTINGS: KgExplorerViewSetting[] = [
  {
    id: 'sort',
    label: 'Sort by',
    options: [
      { value: 'title', label: 'Title' },
      { value: 'date', label: 'Date' },
    ],
  },
];

describe('KgExplorerFilterDrawer', () => {
  async function setup(inputs: Record<string, unknown> = {}) {
    const user = userEvent.setup();
    const selectionChange = vi.fn();
    const clearClick = vi.fn();
    const resetClick = vi.fn();
    const result = await render(KgExplorerFilterDrawer, {
      inputs: { filters: FILTERS, config: CONFIG, ...inputs },
      on: { selectionChange, clearClick, resetClick },
      providers: [{ provide: LOCATION, useValue: { href: '/' } }],
    });

    return { ...result, user, selectionChange, clearClick, resetClick };
  }

  it('renders only the filters section by default', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Customize view' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Organ' })).toBeInTheDocument();
  });

  it('hides the filters section without filters', async () => {
    await setup({ filters: [] });

    expect(screen.queryByRole('heading', { name: 'Filters' })).not.toBeInTheDocument();
  });

  it('renders the breadcrumbs, heading and description when set', async () => {
    await setup({
      breadcrumbs: [{ name: 'Home', command: '/' }, { name: 'App' }],
      heading: 'Product Label',
      description: 'Supporting text',
    });

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Product Label' })).toBeInTheDocument();
    expect(screen.getByText('Supporting text')).toBeInTheDocument();
  });

  it('uses the labels of the config', async () => {
    const { user } = await setup({
      viewToggleOptions: VIEW_OPTIONS,
      viewSettings: VIEW_SETTINGS,
      filterSelections: { type: [FILTERS[0].options[0]] },
      config: {
        filtersLabel: 'Facets',
        clearFiltersLabel: 'Clear all',
        customizeViewLabel: 'Layout',
        resetViewLabel: 'Restore',
        viewOptionsLabel: 'Layouts',
      },
    });

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Date' }));

    expect(screen.getByRole('heading', { name: 'Facets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Layout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Layouts' })).toBeInTheDocument();
  });

  it('updates the active toggle when a view option is picked', async () => {
    const { user, fixture } = await setup({ viewToggleOptions: VIEW_OPTIONS, activeToggle: 'table' });

    expect(screen.getByRole('radio', { name: 'Table' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Grid' }));

    expect(fixture.componentInstance.activeToggle()).toBe('grid');
  });

  it('updates the view setting values when an option is selected', async () => {
    const { user, fixture } = await setup({ viewSettings: VIEW_SETTINGS, viewSettingValues: { group: 'type' } });

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Date' }));

    expect(fixture.componentInstance.viewSettingValues()).toEqual({ group: 'type', sort: 'date' });
  });

  it('shows the reset button only after the view is changed', async () => {
    const { user } = await setup({
      viewToggleOptions: VIEW_OPTIONS,
      viewSettings: VIEW_SETTINGS,
      activeToggle: 'table',
    });

    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Date' }));
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('hides the reset button when the view is changed back to the defaults', async () => {
    const { user } = await setup({ viewToggleOptions: VIEW_OPTIONS });

    await user.click(screen.getByRole('radio', { name: 'Grid' }));
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Table' }));
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('emits when the view is reset and hides the reset button', async () => {
    const { user, resetClick } = await setup({ viewSettings: VIEW_SETTINGS });

    await user.click(screen.getByRole('combobox', { name: 'Sort by' }));
    await user.click(await screen.findByRole('option', { name: 'Date' }));
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(resetClick).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Reset' })).not.toBeInTheDocument();
  });

  it('shows the clear filters button only when a filter has a selection', async () => {
    const { rerender } = await setup({ filterSelections: { type: [] } });

    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();

    await rerender({ inputs: { filterSelections: { type: [FILTERS[0].options[0]] } }, partialUpdate: true });
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('emits when the filters are cleared', async () => {
    const { user, clearClick } = await setup({ filterSelections: { type: [FILTERS[0].options[0]] } });

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(clearClick).toHaveBeenCalled();
  });

  it('emits the new selection when a chip is removed', async () => {
    const [dataset] = FILTERS[0].options;
    const { user, selectionChange } = await setup({ filterSelections: { type: [dataset] } });

    await user.click(screen.getByRole('button', { name: 'Remove Dataset' }));

    expect(selectionChange).toHaveBeenCalledWith({ filter: FILTERS[0], selected: [] });
  });
});
