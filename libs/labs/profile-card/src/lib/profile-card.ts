import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AnyLink } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

/**
 * Profile Card for displaying user information and relevant links
 */
@Component({
  selector: 'ang-profile-card',
  imports: [TextLink, AnyLink],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ang-profile-card-center-content]': 'centerContent()',
    '[class.ang-profile-card-large]': 'variant() === "large"',
  },
})
export class ProfileCard {
  /** Field for profile picture URL */
  readonly pictureUrl = input.required<string>();

  /** Field for profile name */
  readonly name = input.required<string>();

  /** Field for description */
  readonly description = input.required<string>();

  /** Whether to center card content */
  readonly centerContent = input(false, { transform: booleanAttribute });

  /** Whether to use default card or large rounded variant */
  readonly variant = input<'default' | 'large'>('default');

  /** Field for profile name link (only used in large variant) */
  readonly nameLink = input<string>();
}
