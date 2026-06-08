import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  model,
  output,
  OutputEmitterRef,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand, IdGenerator } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

/** Prefix used when generating a custom title id if one is not provided by the consumer. */
const DEFAULT_TITLE_ID_PREFIX = 'ang-cookie-banner-title';

/**
 * Marks projected logo content inside the cookie banner.
 */
@Directive({
  selector: 'ang-cookie-banner-logo, [angCookieBannerLogo]',
  host: { class: 'ang-cookie-banner-logo' },
})
export class CookieBannerLogo {}

/**
 * Marks projected title content and guarantees it has an id for aria labelling.
 */
@Directive({
  selector: 'ang-cookie-banner-title, [angCookieBannerTitle]',
  host: {
    class: 'ang-cookie-banner-title',
    '[attr.id]': 'id()',
  },
})
export class CookieBannerTitle {
  /**
   * Id used for accessibility. Generates a default id if not provided.
   */
  readonly id = input(inject(IdGenerator).getId(DEFAULT_TITLE_ID_PREFIX));
}

/**
 * Marks projected description content inside the cookie banner.
 */
@Directive({
  selector: 'ang-cookie-banner-description, [angCookieBannerDescription]',
  host: { class: 'ang-cookie-banner-description' },
})
export class CookieBannerDescription {}

/**
 * Marks a projected action element and optionally closes the banner when clicked.
 */
@Directive({
  selector: 'ang-cookie-banner-action, [angCookieBannerAction]',
  host: {
    class: 'ang-cookie-banner-action',
    '(click)': 'handleClick()',
  },
})
export class CookieBannerAction {
  /**
   * When true, this action requests closing the banner after click.
   */
  readonly closeOnClick = input(true);

  /** Reference to the parent cookie banner. */
  private readonly banner = inject(CookieBanner);

  /**
   * Closes the parent banner only when both action-level and banner-level
   * closeOnClick settings are enabled.
   */
  protected handleClick(): void {
    if (this.closeOnClick() && this.banner.closeOnClick()) {
      this.banner.close();
    }
  }
}

/**
 * Cookie consent banner.
 *
 * Supports projected title/description/action content, emits user intent events,
 * and can auto-close when users activate action buttons.
 */
@Component({
  selector: 'ang-cookie-banner',
  imports: [AnyLink, MatButton, MatIcon, TextLink, TrackClick],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
  providers: [provideEventScope('cookie-banner')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-cookie-banner',
  },
})
export class CookieBanner {
  /**
   * Controls whether the banner is visible.
   */
  readonly opened = model(true);

  /**
   * Optional privacy policy link configuration.
   */
  readonly privacyPolicy = input<AnyLinkCommand>();

  /**
   * Global close behavior for built-in click handlers.
   */
  readonly closeOnClick = input(true);

  /** Emits when the user accepts all cookies. */
  readonly allowAll = output<void>();

  /** Emits when the user accepts only necessary cookies. */
  readonly allowNecessary = output<void>();

  /** Emits when the user chooses to customize cookie settings. */
  readonly customize = output<void>();

  /** Signal to disable the initial open animation. */
  protected readonly animateOpen = signal(false);

  /**
   * Id used by aria-labelledby. Falls back to a generated id if no title directive is projected.
   */
  protected readonly titleId = computed(() => this.titleDir()?.id() ?? this.idGenerator.getId(DEFAULT_TITLE_ID_PREFIX));

  /** Reference to the projected title directive. */
  private readonly titleDir = contentChild(CookieBannerTitle, { descendants: true });
  /** Reference to the id generator. */
  private readonly idGenerator = inject(IdGenerator);

  /** Initializes the cookie banner. */
  constructor() {
    afterNextRender(() => this.animateOpen.set(true));
  }

  /**
   * Open the banner.
   */
  open(): void {
    this.opened.set(true);
    this.animateOpen.set(true);
  }

  /**
   * Close the banner.
   */
  close(): void {
    this.opened.set(false);
  }

  /**
   * Emits the selected action and closes the banner when closeOnClick is enabled.
   */
  protected handleClick(ref: OutputEmitterRef<void>): void {
    ref.emit();
    if (this.closeOnClick()) {
      this.close();
    }
  }
}
