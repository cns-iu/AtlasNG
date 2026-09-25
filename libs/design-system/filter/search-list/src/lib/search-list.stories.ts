import { MatMenuModule } from '@angular/material/menu';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { SearchList } from './search-list';

const meta: Meta<SearchList> = {
  title: 'Design System/Filter/Search List',
  component: SearchList,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4928-39556',
    },
  },
  args: {
    items: [
      { value: 'heart', label: 'Heart' },
      { value: 'lungs', label: 'Lungs' },
      { value: 'kidney', label: 'Kidney' },
      { value: 'liver', label: 'Liver' },
      { value: 'spleen', label: 'Spleen' },
    ],
    itemSelected: fn().mockName('itemSelected'),
  },
  decorators: [
    moduleMetadata({
      imports: [MatMenuModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <button mat-button type="button" [matMenuTriggerFor]="menu">Category</button>
      <mat-menu #menu="matMenu">
        <ang-search-list [items]="items" (itemSelected)="itemSelected($event)" />
      </mat-menu>
    `,
  }),
};
export default meta;
type Story = StoryObj<SearchList>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
