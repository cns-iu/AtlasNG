import { type Meta, type StoryObj } from '@storybook/angular';
import { SearchList, SearchListOption } from './search-list';

const FILTER_OPTIONS = [
  { label: 'A', count: 9999 },
  { label: 'AB', count: 4299 },
  { label: 'ABC', count: 1799 },
  { label: 'ABCD', count: 899 },
  { label: 'ABCDE', count: 499 },
  { label: 'ABCDEF', count: 299 },
  { label: 'ABCDEFG', count: 199 },
  { label: 'BACDEFGH', count: 99 },
] as SearchListOption[];

const FILTER_OPTIONS_MULTI = [
  { label: 'A', description: 'short description 1', count: 9999 },
  { label: 'AB', description: 'short description 2', count: 4299 },
  {
    label: 'ABC',
    description: 'A much longer description that does not wrap and is truncated once it overflows the list item',
    count: 1799,
  },
  {
    label: 'A very long option label that should wrap next to the count',
    description: 'short description 4',
    count: 899,
  },
  {
    label: 'ABCDE',
    description: 'short description 5',
    count: 499,
  },
  {
    label: 'Another long option label to demonstrate label wrapping behavior',
    description: 'short description 6',
    count: 299,
  },
  {
    label: 'ABCDEFG',
    description: 'short description 7',
    count: 199,
  },
  {
    label: 'BACDEFGH',
    description: 'short description 8',
    count: 99,
  },
] as SearchListOption[];

const FILTER_OPTIONS_THREE_LINE = [
  { label: 'A', description: ['short description 1', 'second description 1'], count: 9999 },
  { label: 'AB', description: ['short description 2', 'second description 2'], count: 4299 },
  {
    label: 'ABC',
    description: ['A much longer first description that is truncated once it overflows', 'second description 3'],
    count: 1799,
  },
  {
    label: 'A very long option label that should wrap next to the count',
    description: ['short description 4', 'second description 4'],
    count: 899,
  },
  {
    label: 'ABCDE',
    description: ['short description 5', 'second description 5'],
    count: 499,
  },
  {
    label: 'Another long option label to demonstrate label wrapping behavior',
    description: ['short description 6', 'A much longer second description that is also truncated once it overflows'],
    count: 299,
  },
  {
    label: 'ABCDEFG',
    description: ['short description 7', 'second description 7'],
    count: 199,
  },
  {
    label: 'BACDEFGH',
    description: ['short description 8', 'second description 8'],
    count: 99,
  },
] as SearchListOption[];

const meta: Meta<SearchList<SearchListOption>> = {
  component: SearchList,
  title: 'Design System / Search List',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=4926-38210',
    },
  },
  args: {
    selected: [{ label: 'A' }, { label: 'ABC' }, { label: 'ABCDE' }],
    searchDisabled: false,
  },
  argTypes: {
    searchDisabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<SearchList<SearchListOption>>;

export const Default: Story = {
  args: {
    options: FILTER_OPTIONS,
  },
  render: (args) => ({
    props: args,
    styles: ['ang-search-list { max-height: 22.25rem; }'],
  }),
};

export const MultiLine: Story = {
  args: {
    options: FILTER_OPTIONS_MULTI,
  },
  render: (args) => ({
    props: args,
    styles: ['ang-search-list { max-height: 22.25rem; width: 22.5rem; }'],
  }),
};

export const ThreeLine: Story = {
  args: {
    options: FILTER_OPTIONS_THREE_LINE,
  },
  render: (args) => ({
    props: args,
    styles: ['ang-search-list { max-height: 22.25rem; width: 22.5rem; }'],
  }),
};
