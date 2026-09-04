import { type Meta, type StoryObj } from '@storybook/angular';

import { InputSelect, InputSelectOption } from './input-select';

const FILTER_OPTIONS = [
  { id: 'a', label: 'A', count: 9999 },
  { id: 'ab', label: 'AB', count: 4299 },
  { id: 'abc', label: 'ABC', count: 1799 },
  { id: 'abcd', label: 'ABCD', count: 899 },
  { id: 'abcde', label: 'ABCDE', count: 499 },
  { id: 'abcdef', label: 'ABCDEF', count: 299 },
  { id: 'abcdefg', label: 'ABCDEFG', count: 199 },
  { id: 'abcdefgh', label: 'BACDEFGH', count: 99 },
] as InputSelectOption[];

const FILTER_OPTIONS_MULTI = [
  { id: 'a', label: 'A', secondaryLabel: 'short description', count: 9999 },
  { id: 'ab', label: 'AB', secondaryLabel: 'short description', count: 4299 },
  { id: 'abc', label: 'ABC', secondaryLabel: 'short description', count: 1799 },
  {
    id: 'abcd',
    label: 'ABCD',
    secondaryLabel: 'short description',
    count: 899,
  },
  {
    id: 'abcde',
    label: 'ABCDE',
    secondaryLabel: 'short description',
    count: 499,
  },
  {
    id: 'abcdef',
    label: 'ABCDEF',
    secondaryLabel: 'short description',
    count: 299,
  },
  {
    id: 'abcdefg',
    label: 'ABCDEFG',
    secondaryLabel: 'short description',
    count: 199,
  },
  {
    id: 'abcdefgh',
    label: 'BACDEFGH',
    secondaryLabel: 'short description',
    count: 99,
  },
] as InputSelectOption[];

const meta: Meta<InputSelect<InputSelectOption>> = {
  component: InputSelect,
  title: 'Design System / Input Select',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/gQEMLugLjweDvbsNNUVffD/AtlasNG-Design-System-Repository?node-id=15056-29156&t=QYdxyXosY82SecIJ-4',
    },
  },
  args: {
    label: 'Search',
    supportingText: 'Supporting text',
    icon: 'search',
    required: false,
    disableRipple: false,
  },
};

export default meta;
type Story = StoryObj<InputSelect<InputSelectOption>>;

export const Default: Story = {
  args: {
    options: FILTER_OPTIONS,
  },
};

export const MultiLine: Story = {
  args: {
    options: FILTER_OPTIONS_MULTI,
  },
};
