import { Component, input } from '@angular/core';
import { provideEventScope } from '@atlasng/analytics';
import { AnyLink, AnyLinkActive, AnyLinkCommand } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/links/text-link';

/** Breadcrumb item */
export interface BreadcrumbItem {
  /** Name of item */
  name: string;
  /** Command to execute when the breadcrumb is clicked */
  command?: AnyLinkCommand;
}

/**
 * Breadcrumb trail showing the current page's location in the site hierarchy.
 *
 * Renders an ordered list inside a navigation landmark labelled by `aria-label` ("Breadcrumb" by default).
 * Crumbs with a command render as links, and the link matching the current URL is
 * marked with `aria-current="page"`. Crumbs without a command render as plain text.
 */
@Component({
  selector: 'ang-breadcrumbs',
  imports: [TextLink, AnyLink, AnyLinkActive],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
  providers: [provideEventScope('breadcrumbs')],
  host: { class: 'ang-breadcrumbs', '[attr.aria-label]': 'null' },
})
export class Breadcrumbs {
  /** Crumbs to display */
  readonly items = input.required<BreadcrumbItem[]>();

  /** Separator to display between crumbs */
  readonly separator = input('/');

  /** Accessible name of the navigation landmark */
  readonly ariaLabel = input('Breadcrumb', { alias: 'aria-label' });
}
