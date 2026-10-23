import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnyLink, AnyLinkCommand, IdGenerator } from '@atlasng/common';
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
 * Directive for a link or button inside a {@link FooterActionGroup}. Applies the footer's link styling.
 */
@Directive({
  selector: 'a[angFooterActionGroupLink], button[angFooterActionGroupLink]',
  host: {
    class: 'ang-footer--action-group-link',
  },
})
export class FooterActionGroupLink {}

/**
 * A column of footer links displayed under a category heading. Projecting one or more groups into the footer
 * switches it to the custom actions variant.
 *
 * Mark each projected link or button with {@link FooterActionGroupLink}. The group is exposed as a `group`
 * named by its category heading.
 */
@Component({
  selector: 'ang-footer-action-group',
  template: `
    <h2 class="ang-footer--action-group-heading" [id]="headingId">{{ category() }}</h2>
    <div class="ang-footer--action-group-links">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-footer--action-group',
    role: 'group',
    '[attr.aria-labelledby]': 'headingId',
  },
})
export class FooterActionGroup {
  /** Category heading displayed above the links. Also names the group for assistive technologies. */
  readonly category = input.required<string>();

  /** ID of the heading, which labels the group. */
  protected readonly headingId = inject(IdGenerator).getId('ang-footer--action-group-heading');
}

/**
 * Bottom section of a webpage, providing essential information and navigation options.
 * The content is wrapped in a `<footer>` element, which is exposed as the `contentinfo` landmark.
 *
 * Projecting {@link FooterActionGroup} elements switches the footer to the custom actions variant, which displays
 * the groups as columns of links under category headings, followed by a Privacy group. The Privacy group emits
 * the same events as the privacy actions of the basic variant.
 */
@Component({
  selector: 'ang-footer',
  imports: [
    AnyLink,
    FooterActionGroup,
    FooterActionGroupLink,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    NgOptimizedImage,
    SocialMediaButton,
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-footer',
    '[class.ang-footer--custom-actions]': 'hasActionGroups()',
  },
})
export class Footer {
  /** An array of social media platforms to display. */
  readonly socials = input<(string | SocialMediaButtonDefinition)[]>();
  /** The URL of the organization's logo. */
  readonly logoImage = input.required<string>();
  /** The name of the organization. */
  readonly organization = input.required<string>();
  /** A command for navigating to the organization's link. */
  readonly organizationLink = input<AnyLinkCommand>('/');
  /** Year used for copyright purposes. */
  readonly copyrightYear = input<number>(new Date().getFullYear());
  /** Tooltip shown on the default logo link. Override it when the link does not lead to the homepage. */
  readonly logoTooltip = input('Homepage');
  /** An event emitted when the privacy policy link is clicked. */
  readonly openPrivacyPolicy = output();
  /** An event emitted when the privacy preferences link is clicked. */
  readonly openPrivacyPreferences = output();

  /** Projected action groups. */
  private readonly actionGroups = contentChildren(FooterActionGroup);

  /** Whether the custom actions variant is displayed. */
  protected readonly hasActionGroups = computed(() => this.actionGroups().length > 0);
}
