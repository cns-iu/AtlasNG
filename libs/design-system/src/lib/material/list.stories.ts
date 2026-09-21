import { signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatList, MatListModule } from '@angular/material/list';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

const SAMPLE_OPTIONS = [
  { label: 'Pomeranian', description: 'Second line', description2: 'Third line', count: 232 },
  { label: 'Corgi', description: 'Second line', description2: 'Third line', count: 935 },
  { label: 'Bulldog', description: 'Second line', description2: 'Third line', count: 13 },
  { label: 'Poodle', description: 'Second line', description2: 'Third line', count: 57 },
  { label: 'Shiba Inu', description: 'Second line', description2: 'Third line', count: 765 },
];

const A_LONG_DESCRIPTION =
  'Supporting line text lorem ipsum dolor sit amet, consectetur. Supporting line text lorem ipsum dolor sit amet, consectetur.';

interface CustomizationControls {
  options: {
    label: string;
    description?: string;
    description2?: string;
    description3?: string;
    count?: number;
  }[];
  showLeadingIcon?: boolean;
}

const meta: Meta<MatList & CustomizationControls> = {
  title: 'Material/List',
  component: MatList,
  args: {
    options: SAMPLE_OPTIONS,
  },
  argTypes: {},
  decorators: [
    moduleMetadata({
      imports: [MatListModule, MatIconModule],
    }),
  ],
};

export default meta;
type Story = StoryObj<MatList & CustomizationControls>;

export const SelectionList: Story = {
  render: (args) => ({
    props: args,
    template: `
    <mat-selection-list>
      @for (option of options; track option) {
        <mat-list-option togglePosition="before">
          <span class="label" matListItemTitle>
            {{ option.label }}
            <span class="count">{{ option.count }}</span>
          </span>
        </mat-list-option>
      }
    </mat-selection-list>
    `,
    styles: [
      `.count {
          margin-left: auto;
        }
      `,
      `.label {
          display: flex;
        }
      `,
    ],
  }),
};

export const NavigationList: Story = {
  args: {
    showLeadingIcon: true,
  },
  render: (args) => ({
    props: {
      ...args,
      activeLink: signal(args.options[0]),
    },
    template: `
    <mat-nav-list>
      @for (option of options; track option) {
        <a
          mat-list-item
          href="/"
          (click)="activeLink.set(option); $event.preventDefault()"
          [activated]="activeLink() === option"
        >
          @if (showLeadingIcon) {
            <mat-icon matListItemIcon>info</mat-icon>
          }
          <span matListItemTitle>{{ option.label }}</span>
        </a>
      }
    </mat-nav-list>
    `,
  }),
};

export const ActionList: Story = {
  render: (args) => ({
    props: {
      ...args,
      activeLink: signal(args.options[0]),
    },
    template: `
    <mat-action-list>
      @for (option of options; track option) {
        <button mat-list-item>
          <mat-icon matListItemIcon>download</mat-icon>
          <span matListItemTitle>{{ option.label }}</span>
        </button>
      }
    </mat-action-list>
    `,
  }),
};

export const TwoLineList: Story = {
  render: (args) => ({
    props: args,
    template: `
    <mat-selection-list>
      @for (option of options; track option) {
        <mat-list-option togglePosition="before">
          <span class="label" matListItemTitle>
            <span>{{ option.label }}</span>
            <span class="count">{{ option.count }}</span>
          </span>
          <span matListItemLine>{{ option.description }}</span>
        </mat-list-option>
      }
    </mat-selection-list>
    `,
    styles: [
      `.count {
          position: absolute;
          right: 0;
          top: 1rem;
        }
      `,
    ],
  }),
};

export const ThreeLineList: Story = {
  render: (args) => ({
    props: args,
    template: `
    <mat-selection-list>
      @for (option of options; track option) {
        <mat-list-option togglePosition="before">
          <span class="label" matListItemTitle>
            <span>{{ option.label }}</span>
            <span class="count">{{ option.count }}</span>
          </span>
          <span matListItemLine>{{ option.description }}</span>
          <span matListItemLine>{{ option.description2 }}</span>
        </mat-list-option>
      }
    </mat-selection-list>
    `,
    styles: [
      `.count {
          position: absolute;
          right: 0;
          top: .75rem;
        }
      `,
    ],
  }),
};

export const ThreeLineListWithWrapping: Story = {
  args: {
    options: SAMPLE_OPTIONS.map((option) => ({
      ...option,
      description: A_LONG_DESCRIPTION,
    })),
  },
  render: (args) => ({
    props: args,
    template: `
    <mat-selection-list>
      @for (option of options; track option) {
        <mat-list-option togglePosition="before" lines="3">
          <span class="label" matListItemTitle>
            <span>{{ option.label }}</span>
            <span class="count">{{ option.count }}</span>
          </span>
          <span>{{ option.description }}</span>
        </mat-list-option>

      }
    </mat-selection-list>
    `,
    styles: [
      `.count {
          position: absolute;
          right: 0;
          top: .75rem;
        }
      `,
    ],
  }),
};
