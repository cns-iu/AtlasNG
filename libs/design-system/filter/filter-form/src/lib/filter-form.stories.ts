import { MatButtonModule } from '@angular/material/button';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
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
    uniqueItemCount: 1000,
    chips: [{ label: 'Liver' }, { label: 'Spleen' }, { label: 'Heart' }, { label: 'Lungs' }, { label: 'Kidney' }],
    showDivider: true,
  },
  argTypes: {
    info: { control: 'text' },
    showDivider: { control: 'boolean' },
  },
  decorators: [
    moduleMetadata({
      imports: [FilterForm, MatButtonModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <ang-filter-form
        ${argsToTemplate(args)}
        style="width: 18.5rem"
      >
        <span angInfoButtonTagline>Filter Info</span>
        This filter allows you to refine your search by selecting specific options from the available choices.
        <div angInfoButtonActions>
          <button matButton>Learn more</button>
        </div>
      </ang-filter-form>
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
