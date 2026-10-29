import { booleanAttribute, Component, input } from '@angular/core';
import { ContentHeader } from '@atlasng/design-system/content/content-header';

/**
 * A content section with a linked heading and projected content below it.
 */
@Component({
  selector: 'ang-content-section',
  imports: [ContentHeader],
  templateUrl: './content-section.html',
  styleUrl: './content-section.scss',
  host: {
    class: 'ang-content-section',
    '[attr.id]': 'null',
  },
})
export class ContentSection {
  /** The text displayed in the section heading. */
  readonly title = input.required<string>();

  /** The heading level to use for the section. */
  readonly level = input.required<number | string>();

  /**
   * The heading ID used for deep links.
   * The ID is never applied to the host element, so a static `id` attribute does not create duplicate IDs.
   */
  readonly id = input<string>();

  /** Whether to display the divider beneath the section heading. */
  readonly underlined = input(true, { transform: booleanAttribute });
}
