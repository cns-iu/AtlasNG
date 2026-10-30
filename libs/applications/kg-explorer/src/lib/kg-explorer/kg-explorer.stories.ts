import type { Type } from '@angular/core';
import { type Args, argsToTemplate, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, userEvent, within } from 'storybook/test';
import {
  KG_EXPLORER_SAMPLE_COLUMNS,
  KG_EXPLORER_SAMPLE_ITEMS,
  KG_EXPLORER_SAMPLE_FILTERS,
  type KgExplorerSampleItem,
} from '../sample-data';
import { MatButton } from '@angular/material/button';
import { Footer, FooterAction, FooterLogo } from '@atlasng/design-system/footer';
import type { KgExplorerFilterSelections } from '../models';
import { KgExplorerTableEndSlot } from '../slots';
import { KgExplorer } from './kg-explorer';

/**
 * Builds story props that narrow the rows down to the selected Type and Organ filter options. The
 * filtered rows are cached so the table only receives a new array when the rows or the selections change.
 *
 * @param args Story args.
 * @returns Props for {@link explorerTemplate}.
 */
function filterProps(args: Args) {
  let cache: { items: unknown; selections: unknown; rows: KgExplorerSampleItem[] } | undefined;

  return {
    ...args,
    filterSelections: {} as KgExplorerFilterSelections,
    filteredItems(items: KgExplorerSampleItem[], selections: KgExplorerFilterSelections) {
      if (cache?.items !== items || cache.selections !== selections) {
        const types = new Set(selections['type']?.map((option) => option.label));
        const organs = new Set(selections['organ']?.map((option) => option.label));
        const rows = items.filter(
          (item) =>
            (types.size === 0 || types.has(item.type)) &&
            (organs.size === 0 || item.tags.some((tag) => organs.has(tag))),
        );
        cache = { items, selections, rows };
      }
      return cache.rows;
    },
  };
}

/**
 * Builds the explorer template with rows filtered by the filter selections.
 *
 * @param args Story args.
 * @param content Content projected into the explorer.
 * @returns Story template.
 */
function explorerTemplate(args: Args, content = ''): string {
  return `
    <ang-kg-explorer
      ${argsToTemplate(args, { exclude: ['items', 'filterSelections'] })}
      [items]="filteredItems(items, filterSelections)"
      [(filterSelections)]="filterSelections"
    >
      ${content}
    </ang-kg-explorer>
  `;
}

const meta: Meta<KgExplorer<KgExplorerSampleItem>> = {
  component: KgExplorer as Type<KgExplorer<KgExplorerSampleItem>>,
  title: 'Applications/KG Explorer',
  decorators: [
    moduleMetadata({
      imports: [Footer, FooterAction, FooterLogo, KgExplorerTableEndSlot, MatButton],
    }),
  ],
  globals: {
    theme: 'WPP Light',
  },
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=8695-21',
    },
  },
  args: {
    items: KG_EXPLORER_SAMPLE_ITEMS,
    columns: KG_EXPLORER_SAMPLE_COLUMNS,
    filters: KG_EXPLORER_SAMPLE_FILTERS,
    filtersOpen: false,
    showSearch: true,
    showResultsCounter: true,
    showEndOfResults: true,
    showDownload: true,
  },
  argTypes: {
    download: { action: 'download' },
    clearFilters: { action: 'clearFilters' },
  },
  render: (args) => ({
    props: filterProps(args),
    template: explorerTemplate(args),
  }),
};

export default meta;

type Story = StoryObj<KgExplorer<KgExplorerSampleItem>>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Viewing 15 of 15')).toBeVisible();

    await userEvent.type(canvas.getByRole('combobox', { name: 'Search' }), 'consectetur');
    // Give viewers time to see the filtered results and suggestions.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(canvas.getByText(/^Viewing \d+ of 15$/)).not.toHaveTextContent('Viewing 15 of 15');

    const [downloadButton] = canvas.getAllByRole('button', { name: 'Choose download format' });
    await userEvent.click(downloadButton);
    const menu = within(document.body).getByRole('menu');
    await expect(within(menu).getByRole('menuitem', { name: /CSV/ })).toBeVisible();
    await userEvent.keyboard('{Escape}');
  },
};

export const Dark: Story = {
  globals: {
    theme: 'WPP Dark',
  },
};

export const FiltersOpen: Story = {
  args: {
    filtersOpen: true,
  },
};

export const NoResults: Story = {
  args: {
    search: 'no matching digital object',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('No results. Adjust filters or search again.')).toBeVisible();
  },
};

export const FewResults: Story = {
  args: {
    items: KG_EXPLORER_SAMPLE_ITEMS.slice(0, 3),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('End of results')).toBeVisible();
  },
};

export const WithoutDownload: Story = {
  args: {
    showDownload: false,
  },
};

export const WithFooter: Story = {
  args: {
    items: KG_EXPLORER_SAMPLE_ITEMS,
  },
  render: (args) => ({
    props: filterProps(args),
    template: explorerTemplate(
      args,
      `
        <ng-template angKgExplorerTableEnd>
          <ang-footer logoImage="" organization="Organization">
            <ang-footer-logo>Logo</ang-footer-logo>
            <a angFooterAction matButton>Privacy</a>
            <a angFooterAction matButton>Accessibility</a>
          </ang-footer>
        </ng-template>
      `,
    ),
  }),
  play: async ({ canvas }) => {
    const footer = canvas.getByRole('contentinfo');
    // Scroll through the table to the footer after the last row.
    footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    await expect(footer).toBeVisible();
  },
};
