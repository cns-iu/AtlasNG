import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  OutputEmitterRef,
  Renderer2,
  RendererStyleFlags2,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { IdGenerator } from '@atlasng/common';
import { RESIZE_OBSERVER } from '@atlasng/core';

/** Prefix used when generating a custom title id if one is not provided by the consumer. */
const DEFAULT_TITLE_ID_PREFIX = 'ang-cookie-banner-title';

/** Class applied to the external container that hosts banner spacing and animation state. */
const CONTAINER_CLASS = 'ang-cookie-banner-container';
/** Class toggled when the banner opens to drive enter animations. */
const OPENED_CLASS = 'ang-cookie-banner-opened';
/** Class toggled when the banner closes to drive exit animations. */
const CLOSED_CLASS = 'ang-cookie-banner-closed';
/** CSS custom property used to reserve layout spacing for the banner height. */
const SPACING_VARIABLE = '--ang-cookie-banner-spacing';

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
 * Marks projected privacy policy content inside the cookie banner.
 */
@Directive({
  selector: 'ang-cookie-banner-privacy-policy, [angCookieBannerPrivacyPolicy]',
  host: { class: 'ang-cookie-banner-privacy-policy' },
})
export class CookieBannerPrivacyPolicy {}

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
  readonly #banner = inject(CookieBanner);

  /**
   * Closes the parent banner only when both action-level and banner-level
   * closeOnClick settings are enabled.
   */
  protected handleClick(): void {
    if (this.closeOnClick() && this.#banner.closeOnClick()) {
      this.#banner.close();
    }
  }
}

/**
 * Marks the container for the cookie banner, which is used to apply spacing and animation classes.
 */
@Directive({
  selector: 'ang-cookie-banner-container, [angCookieBannerContainer]',
  host: { class: 'ang-cookie-banner-container' },
})
export class CookieBannerContainer {
  /**
   * Reference to the host element.
   * @internal
   */
  readonly el = inject(ElementRef).nativeElement as HTMLElement;
}

/**
 * Cookie consent banner.
 *
 * Supports projected title/description/action content, emits user intent events,
 * and can auto-close when users activate action buttons.
 */
@Component({
  selector: 'ang-cookie-banner',
  imports: [MatButton, TrackClick],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
  providers: [provideEventScope('cookie-banner')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-cookie-banner',
    '(animationend)': 'handleAnimationEnd($event)',
  },
})
export class CookieBanner {
  /**
   * Controls whether the banner is visible.
   */
  readonly opened = model(true);

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

  /**
   * Id used by aria-labelledby. Falls back to a generated id if no title directive is projected.
   */
  protected readonly titleId = computed(
    () => this.titleDir()?.id() ?? this.#idGenerator.getId(DEFAULT_TITLE_ID_PREFIX),
  );

  /** Reference to the projected title directive. */
  protected readonly titleDir = contentChild(CookieBannerTitle, { descendants: true });

  /** Reference to the id generator. */
  readonly #idGenerator = inject(IdGenerator);

  /** Renderer used to update host/container classes and inline CSS variables. */
  readonly #renderer = inject(Renderer2);

  /**
   * External element that receives spacing and animation classes.
   * Falls back to document body when no explicit container directive is projected.
   */
  readonly #containerEl = inject(CookieBannerContainer, { optional: true })?.el ?? inject(DOCUMENT).body;

  /** Native host element of this banner instance. */
  readonly #el = inject(ElementRef).nativeElement as HTMLElement;

  /** Current measured banner block size in pixels. */
  readonly #height = signal(0);

  /** Initializes the cookie banner. */
  constructor() {
    this.#initializeContainer();
    this.#monitorHeight();

    let isFirstChange = true;
    effect(() => {
      const animationClasses = this.opened() ? OPENED_CLASS : CLOSED_CLASS;
      if (isFirstChange) {
        isFirstChange = false;
      } else {
        this.#setAnimationClasses(animationClasses);
      }
    });

    effect(() => {
      const height = `${this.#height()}px`;
      this.#renderer.setStyle(this.#containerEl, SPACING_VARIABLE, height, RendererStyleFlags2.DashCase);
    });
  }

  /**
   * Open the banner.
   */
  open(): void {
    this.opened.set(true);
  }

  /**
   * Close the banner.
   */
  close(): void {
    this.opened.set(false);
  }

  /**
   * Emits the selected action and closes the banner when closeOnClick is enabled.
   *
   * @param ref Emitter associated with the selected banner action.
   */
  protected handleClick(ref: OutputEmitterRef<void>): void {
    ref.emit();
    if (this.closeOnClick()) {
      this.close();
    }
  }

  /**
   * Handles the end of an animation event.
   *
   * @param event The animation event.
   */
  protected handleAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'ang-cookie-banner-closed') {
      this.#renderer.setStyle(this.#el, 'display', 'none');
    }
  }

  /**
   * Registers container-level classes/styles and ensures they are removed on destroy.
   */
  #initializeContainer(): void {
    const containerEl = this.#containerEl;
    const renderer = this.#renderer;
    renderer.addClass(containerEl, CONTAINER_CLASS);
    inject(DestroyRef).onDestroy(() => {
      renderer.removeClass(containerEl, CONTAINER_CLASS);
      renderer.removeClass(containerEl, OPENED_CLASS);
      renderer.removeClass(containerEl, CLOSED_CLASS);
      renderer.removeStyle(containerEl, SPACING_VARIABLE, RendererStyleFlags2.DashCase);
    });
  }

  /**
   * Observes host size changes and updates the container spacing CSS variable.
   */
  #monitorHeight(): void {
    const ResizeObserver = inject(RESIZE_OBSERVER);

    if (ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        this.#height.set(entries[0].borderBoxSize[0].blockSize);
      });

      resizeObserver.observe(this.#el);
      inject(DestroyRef).onDestroy(() => resizeObserver.disconnect());
    }
  }

  /**
   * Applies open/closed animation classes to both container and host elements.
   *
   * @param classes Animation class token to apply.
   */
  #setAnimationClasses(classes: string): void {
    const containerEl = this.#containerEl;
    const el = this.#el;
    const renderer = this.#renderer;
    renderer.removeClass(containerEl, OPENED_CLASS);
    renderer.removeClass(containerEl, CLOSED_CLASS);
    renderer.removeClass(el, OPENED_CLASS);
    renderer.removeClass(el, CLOSED_CLASS);
    renderer.removeStyle(el, 'display');
    renderer.addClass(containerEl, classes);
    renderer.addClass(el, classes);
  }
}
