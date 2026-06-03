import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

/** Breadcrumb item */
export interface BreadcrumbItem {
  /** Name of item */
  name: string;
  /** Command to execute when the breadcrumb is clicked */
  command?: AnyLinkCommand;
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
  readonly items = input<BreadcrumbItem[]>([]);

  /** Separator to display between crumbs */
  readonly separator = input<string>('/');
}
