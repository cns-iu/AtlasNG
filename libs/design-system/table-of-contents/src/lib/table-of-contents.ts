import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { AnyLink } from '@atlasng/common';

/** Information used to render one page item in the table of contents. */
export interface TableOfContentsItem {
  /** Text displayed for the item. */
  tagline: string;
  /** Heading level of the corresponding page item. */
  level: number;
  /** Anchor used to identify and navigate to the corresponding item. */
  anchor: string;
}

/** Responsive navigation list for page items. */
@Component({
  selector: 'ang-table-of-contents',
  imports: [AnyLink, MatListModule],
  templateUrl: './table-of-contents.html',
  styleUrl: './table-of-contents.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-table-of-contents' },
})
export class TableOfContents {
  /** Text displayed above the navigation entries. */
  readonly title = input('On this page');

  /** Page items displayed in the navigation list. */
  readonly items = input.required<TableOfContentsItem[]>();

  /** Item currently highlighted in the navigation list. */
  readonly activeItem = model<TableOfContentsItem | undefined>(undefined);
}
