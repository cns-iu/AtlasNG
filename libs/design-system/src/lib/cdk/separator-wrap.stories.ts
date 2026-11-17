import { DEFAULT_FRIENDLY_WRAP_CHARACTERS, FriendlyWrap } from '@atlasng/cdk/friendly-wrap';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';

/** Inline styles of the narrow container that forces the text to wrap. */
const CONTAINER_STYLE = `width: 14rem; padding: 1rem; border: 1px dashed var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium); font: var(--mat-sys-body-medium);`;

/** Strings without spaces that overflow a narrow container unless they get break opportunities. */
const EXAMPLES = [
  { label: 'URL', text: 'https://apps.humanatlas.io/eui/?organ=kidney&sex=female&tab=anatomical-structures' },
  { label: 'IRI', text: 'http://purl.obolibrary.org/obo/UBERON_0002113' },
  { label: 'File name', text: 'hra_v2.3_asct-b_kidney-cortex_2026-11-12.final.xlsx' },
];

const meta: Meta<FriendlyWrap> = {
  component: FriendlyWrap,
  title: 'CDK/Friendly Wrap',
  args: {
    text: EXAMPLES[0].text,
    characters: [...DEFAULT_FRIENDLY_WRAP_CHARACTERS],
  },
  argTypes: {
    text: {
      control: 'text',
      description: 'Text to render.',
    },
    characters: {
      control: 'object',
      description: 'Symbols to break after, as a string of characters or a list of symbols.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [FriendlyWrap],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <p style="${CONTAINER_STYLE}">
        <span [angFriendlyWrap]="text" [angFriendlyWrapCharacters]="characters"></span>
      </p>
    `,
  }),
};

export default meta;
type Story = StoryObj<FriendlyWrap>;

export const Default: Story = {};

/** A long URL, an IRI, and a file name in a narrow container, each wrapping after its separators. */
export const Examples: Story = {
  render: () => ({
    props: { examples: EXAMPLES },
    template: `
      <dl style="${CONTAINER_STYLE} margin: 0;">
        @for (example of examples; track example.label) {
          <dt style="font: var(--mat-sys-label-medium); color: var(--mat-sys-on-surface-variant);">
            {{ example.label }}
          </dt>
          <dd style="margin: 0 0 1rem;"><span [angFriendlyWrap]="example.text"></span></dd>
        }
      </dl>
    `,
  }),
};

/** Break only after slashes, so a path wraps between its segments. */
export const CustomCharacters: Story = {
  args: {
    text: '/usr/local/share/applications/human-reference-atlas/kidney.desktop',
    characters: '/',
  },
};

/** The same text with and without the directive, so the difference in wrapping is visible side by side. */
export const Comparison: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 1rem;">
        <p style="${CONTAINER_STYLE}">
          <strong style="display: block; margin-bottom: 0.5rem;">Without</strong>
          <span>{{ text }}</span>
        </p>
        <p style="${CONTAINER_STYLE}">
          <strong style="display: block; margin-bottom: 0.5rem;">Friendly wrap</strong>
          <span [angFriendlyWrap]="text" [angFriendlyWrapCharacters]="characters"></span>
        </p>
      </div>
    `,
  }),
};
