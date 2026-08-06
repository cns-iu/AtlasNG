import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

interface CustomizationControls {
  firstTabLabel: string;
  secondTabDisabled: boolean;
  secondTabLabel: string;
  thirdTabLabel: string;
}

const customControls: (keyof (MatTabGroup & CustomizationControls))[] = [
  'firstTabLabel',
  'secondTabDisabled',
  'secondTabLabel',
  'stretchTabs',
  'thirdTabLabel',
];

const meta: Meta<MatTabGroup & CustomizationControls> = {
  title: 'Material/Tabs',
  component: MatTabGroup,
  args: {
    animationDuration: '500ms',
    dynamicHeight: false,
    firstTabLabel: 'Overview',
    fitInkBarToContent: false,
    headerPosition: 'above',
    preserveContent: false,
    secondTabDisabled: false,
    secondTabLabel: 'Details',
    selectedIndex: 0,
    stretchTabs: true,
    thirdTabLabel: 'Settings',
  },
  argTypes: {
    animationDuration: {
      control: 'text',
      description: 'Duration of the transition between tab contents.',
    },
    dynamicHeight: {
      control: 'boolean',
      description: 'Whether the group grows to the height of the active tab.',
    },
    firstTabLabel: {
      control: 'text',
      description: 'Label displayed on the first tab.',
    },
    fitInkBarToContent: {
      control: 'boolean',
      description: 'Whether the active indicator fits the width of the tab label.',
    },
    headerPosition: {
      control: 'select',
      description: 'Position of the tab header relative to the tab content.',
      options: ['above', 'below'],
    },
    preserveContent: {
      control: 'boolean',
      description: 'Whether inactive tab content remains in the DOM.',
    },
    secondTabDisabled: {
      control: 'boolean',
      description: 'Whether the second tab is disabled.',
    },
    secondTabLabel: {
      control: 'text',
      description: 'Label displayed on the second tab.',
    },
    selectedIndex: {
      control: { type: 'number', min: 0, max: 2, step: 1 },
      description: 'Zero-based index of the selected tab.',
    },
    stretchTabs: {
      control: 'boolean',
      description: 'Whether tabs stretch to fill the available header width.',
    },
    thirdTabLabel: {
      control: 'text',
      description: 'Label displayed on the third tab.',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatTabsModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <mat-tab-group
        ${argsToTemplate(args, { exclude: customControls })}
        aria-label="Example tabs"
        [mat-stretch-tabs]="stretchTabs"
      >
        <mat-tab [label]="firstTabLabel">
          <p>Content for the {{ firstTabLabel }} tab.</p>
        </mat-tab>
        <mat-tab [label]="secondTabLabel" [disabled]="secondTabDisabled">
          <p>Content for the {{ secondTabLabel }} tab.</p>
        </mat-tab>
        <mat-tab [label]="thirdTabLabel">
          <p>Content for the {{ thirdTabLabel }} tab.</p>
        </mat-tab>
      </mat-tab-group>
    `,
  }),
};

export default meta;
type Story = StoryObj<MatTabGroup & CustomizationControls>;

export const Default: Story = {};

export const SelectedTab: Story = {
  args: {
    selectedIndex: 1,
  },
};

export const DisabledTab: Story = {
  args: {
    secondTabDisabled: true,
  },
};

export const HeaderBelow: Story = {
  args: {
    headerPosition: 'below',
  },
};

export const ContentSizedIndicator: Story = {
  args: {
    fitInkBarToContent: true,
    stretchTabs: false,
  },
};

export const DynamicHeight: Story = {
  args: {
    dynamicHeight: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <mat-tab-group
        ${argsToTemplate(args, { exclude: customControls })}
        aria-label="Dynamic height tabs"
        [mat-stretch-tabs]="stretchTabs"
      >
        <mat-tab [label]="firstTabLabel">
          <p>Short tab content.</p>
        </mat-tab>
        <mat-tab [label]="secondTabLabel" [disabled]="secondTabDisabled">
          <p>This tab has more content to demonstrate the animated height change.</p>
          <p>The tab group adjusts to fit the active panel when dynamic height is enabled.</p>
          <p>Select another tab to see the group return to its shorter height.</p>
        </mat-tab>
        <mat-tab [label]="thirdTabLabel">
          <p>Short tab content.</p>
        </mat-tab>
      </mat-tab-group>
    `,
  }),
};
