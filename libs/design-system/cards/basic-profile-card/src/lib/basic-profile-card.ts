import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

@Component({
  selector: 'ang-basic-profile-card',
  imports: [NgOptimizedImage, TextLink, AnyLink],
  templateUrl: './basic-profile-card.html',
  styleUrl: './basic-profile-card.scss',
})
export class BasicProfileCard {
  /** Field for profile picture URL */
  readonly image = input.required<string>();

  /** Field for profile name */
  readonly name = input.required<string>();

  /** Field(s) for description */
  readonly description = input.required<string | string[]>();

  /** Field for profile name link (only used in large variant) */
  readonly link = input<AnyLinkCommand>();

  /** Ensures that the description is always an array, even if a single string is provided. */
  ensureArray(value: string | string[]): string[] {
    return Array.isArray(value) ? value : [value];
  }
}
