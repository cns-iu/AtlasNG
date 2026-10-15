import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

/** Styles that stack an item's label above its supporting text. */
const ITEM_STYLES = [
  `.ang-menu--item-text {
      display: flex;
      flex-direction: column;
    }
  `,
  `.ang-menu--supporting-text {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
      letter-spacing: var(--mat-sys-label-medium-tracking);
    }
  `,
];

/** Attributes that make a menu item a link opening in a new tab. */
const LINK_ATTRS = 'href="https://www.example.com" target="_blank" rel="noopener noreferrer"';

/** Leading icon, label, and supporting text for an item showing all properties. */
const ITEM_CONTENT = `
  <mat-icon fontIcon="info" />
  <span class="ang-menu--item-text">
    <span>Menu item</span>
    <span class="ang-menu--supporting-text">Supporting text</span>
  </span>
`;

/** Plain text link item. */
const LINK_ITEM = `<a mat-menu-item ${LINK_ATTRS}>Menu item</a>`;

/** Link item with a leading icon and supporting text. */
const DETAILED_LINK_ITEM = `<a mat-menu-item ${LINK_ATTRS}>${ITEM_CONTENT}</a>`;

/** Item with a leading icon and supporting text that opens the submenu. */
const SUBMENU_ITEM = `<button mat-menu-item [matMenuTriggerFor]="submenu">${ITEM_CONTENT}</button>`;

/** Divider between menu items. */
const DIVIDER = '<mat-divider />';

/**
 * Builds a story render function with an icon-button trigger, a menu containing the given items, and a submenu.
 * @param items Markup for the menu items.
 * @returns A story render function.
 */
function renderMenu(items: string[]): Story['render'] {
  return () => ({
    template: `
      <button matIconButton [matMenuTriggerFor]="menu" aria-label="Example icon-button with a menu">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">${items.join('')}</mat-menu>
      <mat-menu #submenu="matMenu">${LINK_ITEM.repeat(3)}</mat-menu>
    `,
    styles: ITEM_STYLES,
  });
}

const meta: Meta = {
  title: 'Material/Menu',
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/BCEJn9KCIbBJ5MzqnojKQp/AtlasNG-Components?node-id=2861-2227',
    },
  },
  decorators: [
    moduleMetadata({
      imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
    }),
  ],
};
export default meta;
type Story = StoryObj;

export const BasicMenu: Story = {
  render: renderMenu(Array(5).fill(LINK_ITEM)),
};

export const AllProperties: Story = {
  render: renderMenu([SUBMENU_ITEM, DIVIDER, SUBMENU_ITEM, DIVIDER, SUBMENU_ITEM]),
};

export const MixedProperties: Story = {
  render: renderMenu([
    SUBMENU_ITEM,
    DIVIDER,
    DETAILED_LINK_ITEM,
    DETAILED_LINK_ITEM,
    SUBMENU_ITEM,
    DIVIDER,
    DETAILED_LINK_ITEM,
  ]),
};
