import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, input, output, OutputEmitterRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { SocialMediaButton, SocialMediaButtonDefinition } from '@atlasng/design-system/buttons/social-media-button';
import { TextLink } from '@atlasng/design-system/text-link';

@Directive({
  selector: 'ang-footer-logo, [angFooterLogo]',
  host: { class: 'ang-footer-logo' },
})
export class FooterLogo {}

@Directive({
  selector: 'ang-footer-action, [angFooterAction]',
  host: {
    class: 'ang-footer-action',
  },
})
export class FooterAction {}

/**
 * Bottom section of a webpage, providing essential information and navigation options
 */
@Component({
  selector: 'ang-footer',
  imports: [CommonModule, MatButtonModule, MatIconModule, SocialMediaButton, TextLink, AnyLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  /** An array of social media platforms to display. */
  readonly socials = input<SocialMediaButtonDefinition[]>();
  /** The URL of the organization's logo. */
  readonly logoUrl = input<string>();
  /** The alt text for the organization's logo. */
  readonly logoAlt = input<string>();
  /** The name of the organization. */
  readonly org = input<string>();
  /** A command for navigating to the organization's link. */
  readonly orgLink = input<AnyLinkCommand>();
  /** Year used for copyright purposes. */
  readonly copyrightYear = input<number>(new Date().getFullYear());
  /** An event emitted when the privacy policy link is clicked. */
  readonly openPrivacyPolicy = output();
  /** An event emitted when the privacy preferences link is clicked. */
  readonly openPrivacyPreferences = output();

  protected handleClick(ref: OutputEmitterRef<void>): void {
    ref.emit();
  }
}
