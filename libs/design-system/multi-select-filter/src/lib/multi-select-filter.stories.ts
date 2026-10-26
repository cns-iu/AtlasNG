import { MatButtonModule } from '@angular/material/button';
import { RichTooltip, RichTooltipAction, RichTooltipClose } from '@atlasng/design-system/rich-tooltip';
import { SearchListOption } from '@atlasng/design-system/search-list';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { MultiSelectFilter } from './multi-select-filter';

const ORGANS: SearchListOption[] = [
  { label: 'Heart', count: 1250 },
  { label: 'Kidney', count: 980 },
  { label: 'Liver', count: 870 },
  { label: 'Lungs', count: 640 },
  { label: 'Spleen', count: 310 },
  { label: 'Pancreas', count: 220 },
  { label: 'Thymus', count: 95 },
];

const meta: Meta<MultiSelectFilter<SearchListOption>> = {
  title: 'Design System/Multi Select Filter',
  component: MultiSelectFilter,
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4928-39556',
    },
  },
  args: {
    label: 'Organ',
    options: ORGANS,
    selected: [ORGANS[0], ORGANS[2]],
    searchDisabled: false,
  },
  argTypes: {
    infoTooltip: { table: { disable: true } },
    count: { control: 'number' },
  },
  decorators: [
    moduleMetadata({
      imports: [MultiSelectFilter, MatButtonModule, RichTooltip, RichTooltipAction, RichTooltipClose],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <ang-multi-select-filter
        ${argsToTemplate(args, { exclude: ['infoTooltip'] })}
        [infoTooltip]="info"
        style="width: 18.5rem"
      />
      <ang-rich-tooltip
        #info
        tagline="Organ"
        description="Refine the results by the organs the data was collected from."
      >
        <button matButton angRichTooltipAction angRichTooltipClose>Learn more</button>
      </ang-rich-tooltip>
    `,
  }),
};
export default meta;
type Story = StoryObj<MultiSelectFilter<SearchListOption>>;

export const Default: Story = {};

export const NoSelection: Story = {
  args: {
    selected: [],
  },
};

export const WithoutSearch: Story = {
  args: {
    searchDisabled: true,
  },
};

export const WithoutInfo: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-multi-select-filter
        ${argsToTemplate(args, { exclude: ['infoTooltip'] })}
        style="width: 18.5rem"
      />
    `,
  }),
};
