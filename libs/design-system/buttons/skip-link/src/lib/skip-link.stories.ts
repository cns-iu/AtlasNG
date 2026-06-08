import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { SkipLink, SkipLinkTargetDirective } from './skip-link';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta = {
  title: 'Design System/Buttons/Skip Link',
  component: SkipLink,
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, SkipLinkTargetDirective],
    }),
  ],
  argTypes: {
    selector: {
      control: 'text',
      description:
        'The CSS selector of the target element to skip to. If not provided, the directive will look for a registered target directive.',
    },
    label: {
      control: 'text',
      description: 'The text to display for the skip link.',
    },
  },
};

export default meta;
type Story = StoryObj;

export const WithSelector: Story = {
  args: {
    selector: '#main-content',
  },
};

export const WithTargetDirective: Story = {
  args: {
    target: '#target',
    label: 'Skip to target',
  },
  render: (args) => ({
    props: args,
    template: `
    <ang-skip-link >
      <a angSkipLinkTarget [target]="target" matButton class="ang-skip-link">
        {{ label }}
      </a>
    </ang-skip-link>
    `,
  }),
};
