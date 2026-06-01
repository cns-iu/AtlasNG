import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TextLink } from '@atlasng/design-system/text-link';
import { AnyLink } from '@atlasng/common';

/** Breadcrumb item */
export interface BreadcrumbItem {
  /** Name of item */
  name: string;
  /** Route to page */
  route?: string;
}

@Component({
  selector: 'ang-breadcrumbs',
  imports: [TextLink, AnyLink],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  /** Crumbs to display */
  readonly crumbs = input<BreadcrumbItem[]>([]);
}
