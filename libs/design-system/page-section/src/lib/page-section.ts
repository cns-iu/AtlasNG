import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SectionHeader } from '@atlasng/design-system/section-header';

/**
 * A page section with a linked heading and projected content below it.
 */
@Component({
  selector: 'ang-page-section',
  imports: [SectionHeader],
  templateUrl: './page-section.html',
  styleUrl: './page-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-page-section' },
})
export class PageSection {
  /** The text displayed in the section heading. */
  readonly title = input.required<string>();

  /** The heading ID used for deep links. */
  readonly id = input<string>();

  /** The heading level to use for the section. */
  readonly level = input<number>(2);

  /** Whether to display the divider beneath the heading. */
  readonly underlined = input(true, { transform: booleanAttribute });

  /** Computed heading level, clamped between 2 and 6. */
  readonly sectionLevel = computed(() => Math.min(Math.max(this.level(), 2), 6));
}
