import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { fn } from 'storybook/test';
import { FilterChip, FilterForm } from './filter-form';

const meta: Meta<FilterForm<FilterChip>> = {
  title: 'Design System/Filter/Filter Form',
  component: FilterForm,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4928-39556',
    },
  },
  args: {
    category: 'Category',
    items: [
      { value: 'heart', label: 'Heart' },
      { value: 'lungs', label: 'Lungs' },
      { value: 'kidney', label: 'Kidney' },
      { value: 'liver', label: 'Liver' },
      { value: 'spleen', label: 'Spleen' },
    ],
    uniqueItemCount: 1000,
    chips: [{ label: 'Liver' }, { label: 'Spleen' }, { label: 'Heart' }, { label: 'Lungs' }, { label: 'Kidney' }],
    info: 'This is some information about the filter.',
    showDivider: true,
    itemSelected: fn().mockName('itemSelected'),
    chipRemoved: fn().mockName('chipRemoved'),
  },
  argTypes: {
    info: { control: 'text' },
    showDivider: { control: 'boolean' },
  },
  decorators: [
    moduleMetadata({
      imports: [FilterForm],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <ang-filter-form
        ${argsToTemplate(args)}
        (itemSelected)="itemSelected($event)"
        (chipRemoved)="chipRemoved($event)"
        style="width: 296px; display: block;"
      />
    `,
  }),
};
export default meta;
type Story = StoryObj<FilterForm<FilterChip>>;

export const Default: Story = {};

export const NoActiveFilters: Story = {
  args: {
    chips: [],
  },
};
