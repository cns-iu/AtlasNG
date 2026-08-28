import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, Directive, input, output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';
import { SocialMediaButton, SocialMediaButtonDefinition } from '@atlasng/design-system/buttons/social-media-button';

/**
 * Directive for the logo section of the footer. Use this directive to project a custom logo into the footer.
 */
@Directive({
  selector: 'ang-footer-logo, [angFooterLogo]',
  host: { class: 'ang-footer--logo' },
})
export class FooterLogo {}

/**
 * Directive for the footer action. Use this directive to project custom content into the footer.
 */
@Directive({
  selector: 'ang-footer-action, [angFooterAction]',
  host: {
    class: 'ang-footer--action',
  },
})
export class FooterAction {}

/**
 * Bottom section of a webpage, providing essential information and navigation options
 */
@Component({
  selector: 'ang-footer',
  imports: [CommonModule, MatButtonModule, MatIconModule, SocialMediaButton, AnyLink, NgOptimizedImage],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-footer',
  },
})
export class Footer {
  /** An array of social media platforms to display. */
  readonly socials = input<(string | SocialMediaButtonDefinition)[]>();
  /** The URL of the organization's logo. */
  readonly logoImage = input.required<string>();
  /** The name of the organization. */
  readonly organization = input<string>();
  /** A command for navigating to the organization's link. */
  readonly organizationLink = input<AnyLinkCommand>();
  /** Year used for copyright purposes. */
  readonly copyrightYear = input<number>(new Date().getFullYear());
  /** An event emitted when the privacy policy link is clicked. */
  readonly openPrivacyPolicy = output();
  /** An event emitted when the privacy preferences link is clicked. */
  readonly openPrivacyPreferences = output();
}
