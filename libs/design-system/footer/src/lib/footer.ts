import { NgOptimizedImage } from '@angular/common';
import { Component, computed, Directive, input, output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventScope, provideEventScope, TrackClick } from '@atlasng/analytics';
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
 * Bottom section of a webpage, providing essential information and navigation options.
 * The content is wrapped in a `<footer>` element, which is exposed as the `contentinfo` landmark.
 */
@Component({
  selector: 'ang-footer',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SocialMediaButton,
    AnyLink,
    NgOptimizedImage,
    EventScope,
    TrackClick,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  providers: [provideEventScope('footer')],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-footer',
  },
})
export class Footer {
  /** An array of social media platforms to display. */
  readonly socials = input<(string | SocialMediaButtonDefinition)[]>();
  /** The URL of the organization's logo. */
  readonly logoSrc = input.required<string>();
  /** The name of the organization. */
  readonly organization = input.required<string>();
  /** A command for navigating to the organization's link. */
  readonly logoLink = input<AnyLinkCommand>('/');
  /** Year used for copyright purposes. */
  readonly copyrightYear = input<number>(new Date().getFullYear());
  /** Tooltip shown on the default logo link. Override it when the link does not lead to the homepage. */
  readonly logoTooltip = input('Homepage');
  /** Accessible name of the default logo link. Defaults to "Visit <organization>". */
  readonly logoLabel = input<string>();
  /** Accessible name of the social media button group. */
  readonly socialsLabel = input('Social media');
  /** An event emitted when the privacy policy link is clicked. */
  readonly privacyPolicyClick = output();
  /** An event emitted when the privacy preferences link is clicked. */
  readonly privacyPreferencesClick = output();

  /** Accessible name of the default logo link with the organization fallback applied. */
  protected readonly resolvedLogoLabel = computed(() => this.logoLabel() ?? `Visit ${this.organization()}`);
}
