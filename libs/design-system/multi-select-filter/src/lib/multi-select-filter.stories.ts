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

/** Organs with their body system as supporting text, enough to scroll the list. */
const ORGANS_WITH_SYSTEMS: SearchListOption[] = [
  { label: 'Heart', description: 'Cardiovascular system', count: 1250 },
  { label: 'Blood vasculature', description: 'Cardiovascular system', count: 1180 },
  { label: 'Kidney', description: 'Urinary system', count: 980 },
  { label: 'Liver', description: 'Digestive system', count: 870 },
  { label: 'Lungs', description: 'Respiratory system', count: 640 },
  { label: 'Brain', description: 'Nervous system', count: 610 },
  { label: 'Skin', description: 'Integumentary system', count: 575 },
  { label: 'Small intestine', description: 'Digestive system', count: 520 },
  { label: 'Large intestine', description: 'Digestive system', count: 505 },
  { label: 'Spleen', description: 'Lymphatic system', count: 310 },
  { label: 'Lymph node', description: 'Lymphatic system', count: 290 },
  { label: 'Pancreas', description: 'Digestive system', count: 220 },
  { label: 'Prostate', description: 'Reproductive system', count: 198 },
  { label: 'Bone marrow', description: 'Hematopoietic system', count: 184 },
  { label: 'Eye', description: 'Sensory system', count: 172 },
  { label: 'Ovary', description: 'Reproductive system', count: 160 },
  { label: 'Uterus', description: 'Reproductive system', count: 151 },
  { label: 'Placenta', description: 'Reproductive system', count: 143 },
  { label: 'Thymus', description: 'Lymphatic system', count: 95 },
  { label: 'Tonsil', description: 'Lymphatic system', count: 88 },
  { label: 'Ureter', description: 'Urinary system', count: 76 },
  { label: 'Urinary bladder', description: 'Urinary system', count: 71 },
  { label: 'Esophagus', description: 'Digestive system', count: 64 },
  { label: 'Stomach', description: 'Digestive system', count: 59 },
  { label: 'Trachea', description: 'Respiratory system', count: 47 },
  { label: 'Main bronchus', description: 'Respiratory system', count: 41 },
  { label: 'Larynx', description: 'Respiratory system', count: 33 },
  { label: 'Spinal cord', description: 'Nervous system', count: 29 },
  { label: 'Thyroid gland', description: 'Endocrine system', count: 24 },
  { label: 'Adrenal gland', description: 'Endocrine system', count: 18 },
  { label: 'Fallopian tube', description: 'Reproductive system', count: 12 },
  { label: 'Knee', description: 'Musculoskeletal system', count: 7 },
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
    disableSearch: false,
    sort: 'asc',
  },
  argTypes: {
    infoPanel: { table: { disable: true } },
    sort: { control: 'inline-radio', options: ['asc', 'desc', 'none'] },
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
        ${argsToTemplate(args, { exclude: ['infoPanel'] })}
        [infoPanel]="info"
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
    disableSearch: true,
  },
};

export const ManyOptions: Story = {
  args: {
    options: ORGANS_WITH_SYSTEMS,
    selected: [ORGANS_WITH_SYSTEMS[0], ORGANS_WITH_SYSTEMS[3]],
  },
};

export const SmallScreen: Story = {
  args: {
    options: ORGANS_WITH_SYSTEMS,
    selected: ORGANS_WITH_SYSTEMS.slice(0, 5),
  },
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Organ' }));
  },
};

export const WithoutInfo: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ang-multi-select-filter
        ${argsToTemplate(args, { exclude: ['infoPanel'] })}
        style="width: 18.5rem"
      />
    `,
  }),
};
