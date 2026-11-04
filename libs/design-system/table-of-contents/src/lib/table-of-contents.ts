import { Component, inject, input, model } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { AnyLink, IdGenerator } from '@atlasng/common';

/** Information used to render one page item in the table of contents. */
export interface TableOfContentsItem {
  /** Text displayed for the item. */
  tagline: string;
  /** Heading level of the corresponding page item. */
  level: number;
  /** Anchor used to identify and navigate to the corresponding item. */
  anchor: string;
}

/**
 * Responsive navigation list for page items.
 *
 * The navigation landmark is labelled by the visible tagline. Activating an item
 * updates the two-way `activeItem` model, and the active item is marked with
 * `aria-current`.
 */
@Component({
  selector: 'ang-table-of-contents',
  imports: [AnyLink, MatListModule],
  templateUrl: './table-of-contents.html',
  styleUrl: './table-of-contents.scss',
  host: { class: 'ang-table-of-contents' },
})
export class TableOfContents {
  /** Text displayed above the navigation entries. */
  readonly tagline = input('On this page');

  /** Page items displayed in the navigation list. */
  readonly items = input.required<TableOfContentsItem[]>();

  /**
   * Item currently highlighted in the navigation list.
   * Updated when the user activates an item, and matched by `anchor`.
   */
  readonly activeItem = model<TableOfContentsItem | undefined>(undefined);

  /** Id of the tagline element that labels the navigation landmark. */
  protected readonly taglineId = inject(IdGenerator).getId('ang-table-of-contents-tagline');

  /**
   * Checks whether an item is the active item
   * @param item Item to check
   * @returns True when the item has the same anchor as the active item
   */
  protected isActive(item: TableOfContentsItem): boolean {
    return this.activeItem()?.anchor === item.anchor;
  }
}
