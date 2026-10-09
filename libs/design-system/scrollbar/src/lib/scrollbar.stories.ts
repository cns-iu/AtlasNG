import { argsToTemplate, type Meta, type StoryObj } from '@storybook/angular';
import { Scrollbar, type ScrollbarOrientation, type ScrollbarPosition, type ScrollbarVisibility } from './scrollbar';

/** Paragraphs of filler text long enough to overflow the demo containers. */
const PARAGRAPHS = Array.from(
  { length: 12 },
  (_, index) =>
    `Paragraph ${index + 1}. Overlay scrollbars sit on top of the content instead of reserving space beside it, ` +
    'so layouts keep their full width. Hover the container to reveal the scrollbar, then drag the thumb or ' +
    'scroll with the wheel, trackpad, or keyboard.',
);

/** Rows for the table demo. */
const ROWS = Array.from({ length: 30 }, (_, index) => ({
  id: index + 1,
  name: `Dataset ${index + 1}`,
  organ: ['Kidney', 'Heart', 'Lung', 'Liver', 'Spleen'][index % 5],
  donors: 10 + ((index * 7) % 40),
  samples: 100 + ((index * 37) % 900),
  technology: ['scRNA-seq', 'CODEX', 'MERFISH', 'Visium', 'snATAC-seq'][index % 5],
  publication: `Journal of Spatial Biology, vol. ${(index % 9) + 1}`,
}));

/** Options for the menu demo. */
const MENU_ITEMS = Array.from({ length: 20 }, (_, index) => `Menu option ${index + 1}`);

/** Shared typography and color styles for demo content. */
const TEXT_STYLE = 'font: var(--mat-sys-body-large); color: var(--mat-sys-on-surface);';

/** Shared style for the surfaces the scrollbar is placed in. */
const SURFACE_STYLE =
  'display: block; background: var(--mat-sys-surface-container-low); ' +
  'border: 1px solid var(--mat-sys-outline-variant); border-radius: var(--mat-sys-corner-medium);';

const meta: Meta<Scrollbar> = {
  component: Scrollbar,
  title: 'Design System/Scrollbar',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=214-1253',
    },
  },
  args: {
    orientation: 'auto',
    visibility: 'hover',
    position: 'native',
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['auto', 'vertical', 'horizontal'] satisfies ScrollbarOrientation[],
      description: 'Directions the content can scroll in.',
    },
    visibility: {
      control: 'select',
      options: ['hover', 'visible', 'native'] satisfies ScrollbarVisibility[],
      description: 'When the scrollbar is shown.',
    },
    position: {
      control: 'select',
      options: ['native', 'invertY', 'invertX', 'invertAll'] satisfies ScrollbarPosition[],
      description: 'Side of the container each scrollbar is placed on.',
    },
  },
  render: (args) => ({
    props: { ...args, paragraphs: PARAGRAPHS },
    template: `
      <ang-scrollbar ${argsToTemplate(args)} style="${SURFACE_STYLE} height: 320px; max-width: 480px;">
        <div style="${TEXT_STYLE} padding: 16px;">
          @for (paragraph of paragraphs; track $index) {
            <p>{{ paragraph }}</p>
          }
        </div>
      </ang-scrollbar>
    `,
  }),
};

export default meta;
type Story = StoryObj<Scrollbar>;

/** Vertically scrolling text. The scrollbar stays hidden until the container is hovered or scrolled. */
export const Default: Story = {};

/** A row of cards that only scrolls horizontally. */
export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
  render: (args) => ({
    props: { ...args, cards: Array.from({ length: 12 }, (_, index) => index + 1) },
    template: `
      <ang-scrollbar ${argsToTemplate(args)} style="${SURFACE_STYLE} max-width: 640px;">
        <div style="${TEXT_STYLE} display: flex; gap: 16px; padding: 16px; width: max-content;">
          @for (card of cards; track card) {
            <div style="width: 160px; height: 120px; padding: 16px; box-sizing: border-box;
              background: var(--mat-sys-surface-container-highest); border-radius: var(--mat-sys-corner-small);">
              Card {{ card }}
            </div>
          }
        </div>
      </ang-scrollbar>
    `,
  }),
};

/** A wide table that overflows in both directions, with a sticky header row. */
export const Table: Story = {
  render: (args) => ({
    props: { ...args, rows: ROWS },
    template: `
      <ang-scrollbar ${argsToTemplate(args)} style="${SURFACE_STYLE} height: 360px; max-width: 720px;">
        <table style="${TEXT_STYLE} border-collapse: collapse; white-space: nowrap;">
          <thead>
            <tr style="position: sticky; top: 0; background: var(--mat-sys-surface-container-high);">
              @for (column of ['ID', 'Name', 'Organ', 'Donors', 'Samples', 'Technology', 'Publication']; track column) {
                <th style="padding: 12px 16px; text-align: left; font: var(--mat-sys-title-small);">{{ column }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.id) {
              <tr style="border-top: 1px solid var(--mat-sys-outline-variant);">
                <td style="padding: 12px 16px;">{{ row.id }}</td>
                <td style="padding: 12px 16px;">{{ row.name }}</td>
                <td style="padding: 12px 16px;">{{ row.organ }}</td>
                <td style="padding: 12px 16px;">{{ row.donors }}</td>
                <td style="padding: 12px 16px;">{{ row.samples }}</td>
                <td style="padding: 12px 16px;">{{ row.technology }}</td>
                <td style="padding: 12px 16px;">{{ row.publication }}</td>
              </tr>
            }
          </tbody>
        </table>
      </ang-scrollbar>
    `,
  }),
};

/** A dialog-style surface whose header and actions stay fixed while the body scrolls. */
export const InModal: Story = {
  args: { orientation: 'vertical' },
  render: (args) => ({
    props: { ...args, paragraphs: PARAGRAPHS },
    template: `
      <div role="dialog" aria-labelledby="scrollbar-modal-title"
        style="${TEXT_STYLE} display: flex; flex-direction: column; width: 480px; max-height: 420px;
          background: var(--mat-sys-surface-container-high); border-radius: var(--mat-sys-corner-extra-large);
          box-shadow: var(--mat-sys-level3);">
        <h2 id="scrollbar-modal-title" style="margin: 0; padding: 24px 24px 16px; font: var(--mat-sys-headline-small);">
          Terms of use
        </h2>
        <ang-scrollbar ${argsToTemplate(args)} style="flex: 1 1 auto; min-height: 0;">
          <div style="padding: 0 24px;">
            @for (paragraph of paragraphs; track $index) {
              <p>{{ paragraph }}</p>
            }
          </div>
        </ang-scrollbar>
        <div style="display: flex; justify-content: flex-end; gap: 8px; padding: 16px 24px 24px;">
          <button type="button">Decline</button>
          <button type="button">Accept</button>
        </div>
      </div>
    `,
  }),
};

/** A menu-style list with more options than fit in its maximum height. */
export const InMenu: Story = {
  args: { orientation: 'vertical' },
  render: (args) => ({
    props: { ...args, items: MENU_ITEMS },
    template: `
      <ang-scrollbar ${argsToTemplate(args)}
        style="${TEXT_STYLE} width: 240px; max-height: 240px; background: var(--mat-sys-surface-container);
          border-radius: var(--mat-sys-corner-extra-small); box-shadow: var(--mat-sys-level2);">
        <ul role="menu" style="list-style: none; margin: 0; padding: 8px 0;">
          @for (item of items; track item) {
            <li role="menuitem" tabindex="-1" style="padding: 12px 16px; cursor: pointer;">{{ item }}</li>
          }
        </ul>
      </ang-scrollbar>
    `,
  }),
};
