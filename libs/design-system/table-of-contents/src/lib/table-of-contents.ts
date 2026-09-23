import { booleanAttribute, ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { AnyLink } from '@atlasng/common';

/** Information used to render one page section in the table of contents. */
export interface PageSectionInstance {
  /** Text displayed for the section entry. */
  tagline: string;
  /** Heading level of the corresponding page section. */
  level: number;
  /** Anchor used to identify and navigate to the corresponding section. */
  anchor: string;
}

/** Responsive navigation list for page sections. */
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

  /** Page sections displayed in the navigation list. */
  readonly sections = input.required<PageSectionInstance[]>();

  readonly showFirstSection = input(false, { transform: booleanAttribute });

  /** Emits the anchor of the selected page section. */
  readonly anchorSelected = output<string>();

  /** Section currently highlighted in the navigation list. */
  protected readonly activeSection = signal<string | undefined>(undefined);

  /** Selects a section and emits its anchor. */
  protected selectSection(anchor: string): void {
    this.activeSection.set(anchor);
    this.anchorSelected.emit(anchor);
  }
}
