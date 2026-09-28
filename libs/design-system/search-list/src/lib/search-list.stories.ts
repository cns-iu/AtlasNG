import { type Meta, type StoryObj } from '@storybook/angular';
import { SearchList, SearchListOption } from './search-list';

const FILTER_OPTIONS = [
  { id: 'a', label: 'A', count: 9999 },
  { id: 'ab', label: 'AB', count: 4299 },
  { id: 'abc', label: 'ABC', count: 1799 },
  { id: 'abcd', label: 'ABCD', count: 899 },
  { id: 'abcde', label: 'ABCDE', count: 499 },
  { id: 'abcdef', label: 'ABCDEF', count: 299 },
  { id: 'abcdefg', label: 'ABCDEFG', count: 199 },
  { id: 'abcdefgh', label: 'BACDEFGH', count: 99 },
] as SearchListOption[];

const FILTER_OPTIONS_MULTI = [
  { id: 'a', label: 'A', description: 'short description', count: 9999 },
  { id: 'ab', label: 'AB', description: 'short description', count: 4299 },
  { id: 'abc', label: 'ABC', description: 'short description', count: 1799 },
  {
    id: 'abcd',
    label: 'ABCD',
    description: 'short description',
    count: 899,
  },
  {
    id: 'abcde',
    label: 'ABCDE',
    description: 'short description',
    count: 499,
  },
  {
    id: 'abcdef',
    label: 'ABCDEF',
    description: 'short description',
    count: 299,
  },
  {
    id: 'abcdefg',
    label: 'ABCDEFG',
    description: 'short description',
    count: 199,
  },
  {
    id: 'abcdefgh',
    label: 'BACDEFGH',
    description: 'short description',
    count: 99,
  },
] as SearchListOption[];

const FILTER_OPTIONS_THREE_LINE = [
  { id: 'a', label: 'A', description: 'short description', description2: 'second description', count: 9999 },
  { id: 'ab', label: 'AB', description: 'short description', description2: 'second description', count: 4299 },
  { id: 'abc', label: 'ABC', description: 'short description', description2: 'second description', count: 1799 },
  {
    id: 'abcd',
    label: 'ABCD',
    description: 'short description',
    description2: 'second description',
    count: 899,
  },
  {
    id: 'abcde',
    label: 'ABCDE',
    description: 'short description',
    description2: 'second description',
    count: 499,
  },
  {
    id: 'abcdef',
    label: 'ABCDEF',
    description: 'short description',
    description2: 'second description',
    count: 299,
  },
  {
    id: 'abcdefg',
    label: 'ABCDEFG',
    description: 'short description',
    description2: 'second description',
    count: 199,
  },
  {
    id: 'abcdefgh',
    label: 'BACDEFGH',
    description: 'short description',
    description2: 'second description',
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
    selected: [
      { id: 'a', label: 'A' },
      { id: 'abc', label: 'ABC' },
      { id: 'abcde', label: 'ABCDE' },
    ],
    disableSearch: false,
    disableRipple: false,
  },
  argTypes: {
    disableSearch: {
      control: 'boolean',
    },
    disableRipple: {
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
    styles: ['ang-search-list { max-height: 22.25rem; }'],
  }),
};

export const ThreeLine: Story = {
  args: {
    options: FILTER_OPTIONS_THREE_LINE,
  },
  render: (args) => ({
    props: args,
    styles: ['ang-search-list { max-height: 22.25rem; }'],
  }),
};
