import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnyLinkCommand } from '@atlasng/common';
import { SocialMediaButton } from '@atlasng/design-system/buttons/social-media';
import { TextLink } from '@atlasng/design-system/text-link';

/**
 * Bottom section of a webpage, providing essential information and navigation options
 */
@Component({
  selector: 'ang-footer',
  imports: [CommonModule, MatButtonModule, MatIconModule, SocialMediaButton, TextLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  /** An array of social media platforms to display. */
  readonly socials = input<string[]>();
  /** The URL of the organization's logo. */
  readonly logoUrl = input<string>();
  /** The name of the organization. */
  readonly orgName = input<string>();
  /** The email address for contact purposes. */
  readonly email = input<string>();
  /** A command for navigating to the organization's link. */
  readonly orgLink = input<AnyLinkCommand>();
  /** The current year, used for copyright purposes. */
  readonly fullYear = new Date().getFullYear();
}
