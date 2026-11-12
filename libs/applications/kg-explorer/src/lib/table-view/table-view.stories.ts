import type { Type } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Footer, FooterAction, FooterLogo } from '@atlasng/design-system/footer';
import { type Args, argsToTemplate, type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  KG_EXPLORER_SAMPLE_COLUMNS,
  KG_EXPLORER_SAMPLE_FILTERS,
  KG_EXPLORER_SAMPLE_ITEMS,
  kgExplorerSampleFormats,
  type KgExplorerSampleItem,
} from '../sample-data';
import { KgExplorerTableView } from './table-view';

/**
 * Builds the table view template.
 *
 * @param args Story args.
 * @param content Content projected into the table view.
 * @returns Story template.
 */
function explorerTemplate(args: Args, content = ''): string {
  return `
    <ang-kg-explorer-table-view ${argsToTemplate(args)}>
      ${content}
    </ang-kg-explorer-table-view>
  `;
}

const meta: Meta<KgExplorerTableView<KgExplorerSampleItem>> = {
  component: KgExplorerTableView as Type<KgExplorerTableView<KgExplorerSampleItem>>,
  title: 'Applications/KG Explorer',
  decorators: [
    moduleMetadata({
      imports: [Footer, FooterAction, FooterLogo, MatButton],
    }),
  ],
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
    config: { downloadFormats: kgExplorerSampleFormats },
  },
  argTypes: {
    download: { action: 'download' },
  },
  render: (args) => ({
    props: args,
    template: explorerTemplate(args),
    styles: [
      `
        .ang-kg-explorer-table-view {
          height: 100vh;
        }
      `,
    ],
  }),
};

export default meta;

type Story = StoryObj<KgExplorerTableView<KgExplorerSampleItem>>;

export const Default: Story = {};

export const Demo: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Viewing 15 of 15')).toBeVisible();

    await userEvent.type(canvas.getByRole('combobox', { name: 'Search' }), 'consectetur');
    // Give viewers time to see the filtered results and suggestions.
    waitFor(() => expect(canvas.getByText(/^Viewing \d+ of 15$/)).not.toHaveTextContent('Viewing 15 of 15'), {
      timeout: 2000,
    });

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
    config: {},
  },
};

export const WithFooter: Story = {
  args: {
    items: KG_EXPLORER_SAMPLE_ITEMS,
  },
  render: (args) => ({
    props: args,
    template: explorerTemplate(
      args,
      `
        <ang-footer logoImage="" organization="Organization">
          <ang-footer-logo>Logo</ang-footer-logo>
          <a angFooterAction matButton>Privacy</a>
          <a angFooterAction matButton>Accessibility</a>
        </ang-footer>
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
