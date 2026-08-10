import { NgOptimizedImage } from '@angular/common';
import { booleanAttribute, Component, Directive, input } from '@angular/core';

/**
 * Marks an element for projection into a brand profile card's action area.
 *
 * Apply the directive to links, buttons, or other interactive elements placed
 * inside a {@link BrandProfileCard}.
 */
@Directive({
  selector: 'ang-brand-profile-card-action, [angBrandProfileCardAction]',
  host: { class: 'ang-brand-profile-card--action' },
})
export class BrandProfileCardAction {}

/**
 * Presents a person's image, name, description, and optional actions in a
 * compact branded profile card.
 */
@Component({
  selector: 'ang-brand-profile-card',
  imports: [NgOptimizedImage],
  templateUrl: './brand-profile-card.html',
  styleUrl: './brand-profile-card.scss',
  host: {
    class: 'ang-brand-profile-card',
    '[class.ang-brand-profile-card--centered]': 'centered()',
  },
})
export class BrandProfileCard {
  /** URL of the profile image displayed by the card. */
  readonly image = input.required<string>();

  /** Name displayed as the card title and used in the profile image alternative text. */
  readonly name = input.required<string>();

  /** Supporting profile description displayed below the name. */
  readonly description = input.required<string>();

  /** Whether to center the card content and projected actions. */
  readonly centered = input(false, { transform: booleanAttribute });
}
