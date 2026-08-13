import { coerceArray } from '@angular/cdk/coercion';
import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

/**
 * A basic profile card component that displays a profile picture, name, description(s), and an optional link.
 */
@Component({
  selector: 'ang-basic-profile-card',
  imports: [NgOptimizedImage, TextLink, AnyLink],
  templateUrl: './basic-profile-card.html',
  styleUrl: './basic-profile-card.scss',
  host: { class: 'ang-basic-profile-card' },
})
export class BasicProfileCard {
  /** Field for profile picture URL */
  readonly image = input.required<string>();

  /** Field for profile name */
  readonly name = input.required<string>();

  /** Field(s) for description */
  readonly description = input.required({ transform: coerceArray<string> });

  /** Field for profile name link */
  readonly link = input<AnyLinkCommand>();
}
