import { MatButtonModule } from '@angular/material/button';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { argsToTemplate, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

interface CustomizationControls {
  secondPanelDisabled: boolean;
}

const customControls: (keyof CustomizationControls)[] = ['secondPanelDisabled'];

const meta: Meta<MatAccordion & CustomizationControls> = {
  title: 'Material/Expansion Panel',
  component: MatAccordion,
  args: {
    displayMode: 'default',
    hideToggle: false,
    multi: false,
    secondPanelDisabled: false,
    togglePosition: 'after',
  },
  argTypes: {
    displayMode: {
      control: 'select',
      description:
        'Display mode of the accordion. Default mode offsets the expanded panel; flat mode keeps the panels aligned.',
      options: ['default', 'flat'],
    },
    hideToggle: {
      control: 'boolean',
      description: 'Whether the expansion indicator is hidden.',
    },
    multi: {
      control: 'boolean',
      description: 'Whether several panels can be expanded at the same time.',
    },
    secondPanelDisabled: {
      control: 'boolean',
      description: 'Whether the second panel is disabled.',
    },
    togglePosition: {
      control: 'select',
      description: 'Position of the expansion indicator relative to the header.',
      options: ['before', 'after'],
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatExpansionModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <mat-accordion ${argsToTemplate(args, { exclude: customControls })}>
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>Personal data</mat-panel-title>
            <mat-panel-description>Type your name and age</mat-panel-description>
          </mat-expansion-panel-header>
          <p>Content for the first panel.</p>
        </mat-expansion-panel>
        <mat-expansion-panel [disabled]="secondPanelDisabled">
          <mat-expansion-panel-header>
            <mat-panel-title>Destination</mat-panel-title>
            <mat-panel-description>Type the country name</mat-panel-description>
          </mat-expansion-panel-header>
          <p>Content for the second panel.</p>
        </mat-expansion-panel>
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Day of the trip</mat-panel-title>
            <mat-panel-description>Inform the date you wish to travel</mat-panel-description>
          </mat-expansion-panel-header>
          <p>Content for the third panel.</p>
        </mat-expansion-panel>
      </mat-accordion>
    `,
  }),
};

export default meta;
type Story = StoryObj<MatAccordion & CustomizationControls>;

export const Default: Story = {};

export const Multi: Story = {
  args: {
    multi: true,
  },
};

export const Flat: Story = {
  args: {
    displayMode: 'flat',
  },
};

export const ToggleBefore: Story = {
  args: {
    togglePosition: 'before',
  },
};

export const HiddenToggle: Story = {
  args: {
    hideToggle: true,
  },
};

export const DisabledPanel: Story = {
  args: {
    secondPanelDisabled: true,
  },
};

export const ActionRow: Story = {
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule],
    }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <mat-accordion ${argsToTemplate(args, { exclude: customControls })} #accordion="matAccordion">
        <mat-expansion-panel expanded #first>
          <mat-expansion-panel-header>
            <mat-panel-title>Personal data</mat-panel-title>
            <mat-panel-description>Type your name and age</mat-panel-description>
          </mat-expansion-panel-header>
          <p>Content for the first panel.</p>
          <mat-action-row>
            <button matButton (click)="second.open()">Next</button>
          </mat-action-row>
        </mat-expansion-panel>
        <mat-expansion-panel [disabled]="secondPanelDisabled" #second>
          <mat-expansion-panel-header>
            <mat-panel-title>Destination</mat-panel-title>
            <mat-panel-description>Type the country name</mat-panel-description>
          </mat-expansion-panel-header>
          <p>Content for the second panel.</p>
          <mat-action-row>
            <button matButton (click)="first.open()">Previous</button>
            <button matButton (click)="third.open()">Next</button>
          </mat-action-row>
        </mat-expansion-panel>
        <mat-expansion-panel #third>
          <mat-expansion-panel-header>
            <mat-panel-title>Day of the trip</mat-panel-title>
            <mat-panel-description>Inform the date you wish to travel</mat-panel-description>
          </mat-expansion-panel-header>
          <p>Content for the third panel.</p>
          <mat-action-row>
            <button matButton (click)="second.open()">Previous</button>
            <button matButton="filled" (click)="accordion.closeAll()">End</button>
          </mat-action-row>
        </mat-expansion-panel>
      </mat-accordion>
    `,
  }),
};
