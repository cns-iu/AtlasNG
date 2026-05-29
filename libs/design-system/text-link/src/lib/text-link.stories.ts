import { MatIconModule } from '@angular/material/icon';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { TextLink } from './text-link';

interface WithIcon {
  icon?: string;
}

const meta: Meta<TextLink & WithIcon> = {
  title: 'Design System/Buttons/Text Link',
  component: TextLink,
  decorators: [
    moduleMetadata({
      imports: [MatIconModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      Lorem ipsum dolor sit amet,
      <a angTextLink href="https://example.com" target="_blank">
        consectetur adipiscing elit.
        @if (icon) {
          <mat-icon [fontIcon]="icon" />
        }
      </a>
      Donec suscipit auctor dui, a efficitur ligula.
    `,
  }),
};

export default meta;
type Story = StoryObj<TextLink & WithIcon>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    icon: 'arrow_right_alt',
  },
  argTypes: {
    icon: {
      control: 'text',
    },
  },
};
