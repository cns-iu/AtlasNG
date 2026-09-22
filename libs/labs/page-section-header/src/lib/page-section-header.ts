import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbItem, Breadcrumbs } from '@atlasng/design-system/buttons/breadcrumbs';
import { SectionHeader } from '@atlasng/design-system/section-header';

/**
 * Page-level section header combining breadcrumbs, an `h1` page label (using
 * `@atlasng/labs/section-header` for its optional deep link and divider), an optional short
 * description, and a primary/secondary action button group.
 */
@Component({
  selector: 'ang-page-section-header',
  imports: [Breadcrumbs, MatButtonModule, SectionHeader],
  templateUrl: './page-section-header.html',
  styleUrl: './page-section-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-page-section-header' },
})
export class PageSectionHeader {
  /** Whether to display the breadcrumbs. */
  readonly showBreadcrumbs = input(true, { transform: booleanAttribute });

  /** Breadcrumb items to display above the page label. */
  readonly breadcrumbs = input<BreadcrumbItem[]>();

  /** Whether to display the divider beneath the page label. */
  readonly showDivider = input(true, { transform: booleanAttribute });

  /** Whether to display the short description. */
  readonly showDescription = input(true, { transform: booleanAttribute });

  /** Short description of the page content. */
  readonly description = input<string>();

  /** Whether to display the button group. */
  readonly showButtonGroup = input(true, { transform: booleanAttribute });

  /** Label for the primary (filled) action button. */
  readonly primaryActionLabel = input<string>();

  /** Whether to display the secondary action button. */
  readonly showSecondaryButton = input(true, { transform: booleanAttribute });

  /** Label for the secondary (outlined) action button. */
  readonly secondaryActionLabel = input<string>();

  /** Emits when the primary action button is clicked. */
  readonly primaryAction = output<void>();

  /** Emits when the secondary action button is clicked. */
  readonly secondaryAction = output<void>();
}
