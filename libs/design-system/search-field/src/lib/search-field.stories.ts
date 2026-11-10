import { normalizeSearchText, provideSearch, SearchEngine, SearchIndex, withCustomEngine } from '@atlasng/cdk/search';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular';
import { SearchField } from './search-field';

const ORGANS = [
  'Bone Marrow',
  'Brain',
  'Eye',
  'Fallopian Tube',
  'Heart',
  'Kidney',
  'Large Intestine',
  'Liver',
  'Lung',
  'Lymph Node',
  'Ovary',
  'Pancreas',
  'Pâncreas Accessório',
  'Placenta',
  'Prostate',
  'Skin',
  'Small Intestine',
  'Spleen',
  'Thymus',
  'Ureter',
  'Urinary Bladder',
  'Uterus',
  'Vasculature',
  'Vésicule Biliaire',
];

/** A search engine that only matches values starting with the term, ignoring case and accents. */
class StartsWithSearchEngine implements SearchEngine {
  createIndex<T>(items: readonly T[]): SearchIndex<T> {
    const values = items.map(String);
    const matches = (value: string, term: string) => normalizeSearchText(value).startsWith(normalizeSearchText(term));
    return {
      search: ({ term }) =>
        items.flatMap((item, index) =>
          matches(values[index], term)
            ? [
                {
                  item,
                  matches: [{ field: 'value', value: values[index], ranges: [[0, term.trim().length] as const] }],
                },
              ]
            : [],
        ),
      suggest: (term, limit) =>
        values
          .filter((value) => matches(value, term))
          .slice(0, limit)
          .map((value) => ({ value, ranges: [[0, term.trim().length] as const] })),
    };
  }
}

const meta: Meta<SearchField> = {
  component: SearchField,
  title: 'Design System/Search Field',
  args: {
    label: 'Search',
    placeholder: '',
    disabled: false,
    value: '',
  },
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    debounce: {
      control: 'number',
    },
  },
  render: (args) => ({
    props: args,
    styles: ['ang-search-field { max-width: 36.25rem; }'],
  }),
};

export default meta;
type Story = StoryObj<SearchField>;

export const Default: Story = {
  args: {
    items: ORGANS,
  },
};

export const HighlightedSuggestions: Story = {
  args: {
    items: ORGANS,
    label: 'Search organs',
    placeholder: 'Try "pancreas" or "vesicule"',
    value: 'pa',
  },
};

export const ExplicitSuggestions: Story = {
  args: {
    suggestions: ['Kidney', 'Kidney, left', 'Kidney, right'],
    label: 'Search remote organs',
    value: 'kid',
  },
};

export const CustomEngine: Story = {
  args: {
    items: ORGANS,
    label: 'Search organs by prefix',
  },
  decorators: [
    applicationConfig({
      providers: [provideSearch(withCustomEngine(() => new StartsWithSearchEngine()))],
    }),
  ],
};

export const Disabled: Story = {
  args: {
    items: ORGANS,
    disabled: true,
    value: 'Heart',
  },
};
