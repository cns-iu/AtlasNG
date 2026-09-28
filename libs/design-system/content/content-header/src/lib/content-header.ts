import { booleanAttribute, Component, input } from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { AnyLink } from '@atlasng/common';
import { Heading } from '@atlasng/design-system/content/heading';

/**
 * Renders a section heading with an optional self-link and underline.
 *
 * A non-empty `id` is applied to the heading and turns the tagline into a link
 * to that heading. Without an `id`, the tagline is rendered as plain text.
 */
@Component({
  selector: 'ang-content-header',
  imports: [AnyLink, Heading, MatDivider, MatIcon],
  templateUrl: './content-header.html',
  styleUrl: './content-header.scss',
  host: { class: 'ang-content-header' },
})
export class ContentHeader {
  /** Text displayed in the heading. */
  readonly tagline = input.required<string>();

  /** Native heading level used to render the tagline as an `h1` through `h6`. */
  readonly level = input.required<number | string>();

  /** Optional heading ID used to create a self-link. */
  readonly id = input<string>();

  /** Whether to display a divider below the heading. */
  readonly underlined = input(true, { transform: booleanAttribute });
}
