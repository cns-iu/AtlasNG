import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { PageSectionHeader } from './page-section-header';
import { LinkSnippet } from '@atlasng/design-system/link-snippet';
import { MatButtonModule } from '@angular/material/button';

const meta: Meta<PageSectionHeader> = {
  component: PageSectionHeader,
  title: 'Design System/Page Section Header',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=7019-111',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [LinkSnippet, MatButtonModule],
    }),
  ],
  args: {
    showBreadcrumbs: true,
    breadcrumbs: [{ name: 'Home', command: '/' }, { name: 'Label' }],
    showDivider: true,
    showDescription: true,
    description: 'Short description of content less than 125 characters.',
    showButtonGroup: true,
    primaryActionLabel: 'Action',
    showSecondaryButton: true,
    secondaryActionLabel: 'Action',
  },
  argTypes: {
    showBreadcrumbs: {
      control: 'boolean',
      description: 'Whether to display the breadcrumbs.',
    },
    breadcrumbs: {
      control: 'object',
      description: 'Breadcrumb items to display above the page label.',
    },
    showDivider: {
      control: 'boolean',
      description: 'Whether to display the divider beneath the page label.',
    },
    showDescription: {
      control: 'boolean',
      description: 'Whether to display the short description.',
    },
    description: {
      control: 'text',
      description: 'Short description of the page content.',
    },
    showButtonGroup: {
      control: 'boolean',
      description: 'Whether to display the button group.',
    },
    primaryActionLabel: {
      control: 'text',
      description: 'Label for the primary (filled) action button.',
    },
    showSecondaryButton: {
      control: 'boolean',
      description: 'Whether to display the secondary action button.',
    },
    secondaryActionLabel: {
      control: 'text',
      description: 'Label for the secondary (outlined) action button.',
    },
  },
  render: (args) => ({
    props: args,
    template: `<ang-page-section-header ${argsToTemplate(args)}>Page Label</ang-page-section-header>`,
  }),
};

export default meta;
type Story = StoryObj<PageSectionHeader>;

export const Default: Story = {};

export const CustomContent: Story = {
  args: { showDivider: false, showDescription: false, showButtonGroup: false },
  render: (args) => ({
    props: args,
    template: `
      <ang-page-section-header ${argsToTemplate(args)}>
        <div angPageSectionHeaderTopContent style="display: flex; gap: .75rem;">
          <img src="assets/logo1.png" alt="Placeholder image"/>
          <img src="assets/logo2.png" alt="Placeholder image"/>
        </div>
        Page Section Header With Link Snippet
        <ang-link-snippet angPageSectionHeaderBottomContent url="https://purl.humanatlas.io/2d-ftu/skin-hair-follicle" />
        <button matButton="filled" angPageSectionHeaderBottomContent style="width: fit-content;">Custom Action</button>
      </ang-page-section-header>
    `,
  }),
};
