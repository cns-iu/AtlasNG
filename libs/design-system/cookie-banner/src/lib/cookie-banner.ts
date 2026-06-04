import { coerceElement } from '@angular/cdk/coercion';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  HostAttributeToken,
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
import { provideEventScope } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand, IdGenerator } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

const DEFAULT_TITLE_ID_PREFIX = 'ang-cookie-banner-title';

@Directive({
  selector: 'ang-cookie-banner-logo, [angCookieBannerLogo]',
  host: { class: 'ang-cookie-banner-logo' },
})
export class CookieBannerLogo {}

@Directive({
  selector: 'ang-cookie-banner-title, [angCookieBannerTitle]',
  host: {
    class: 'ang-cookie-banner-title',
    '[attr.id]': 'id()',
  },
})
export class CookieBannerTitle {
  readonly id = input(
    inject(new HostAttributeToken('id'), { optional: true }) ?? inject(IdGenerator).getId(DEFAULT_TITLE_ID_PREFIX),
  );
}

@Directive({
  selector: 'ang-cookie-banner-description, [angCookieBannerDescription]',
  host: { class: 'ang-cookie-banner-description' },
})
export class CookieBannerDescription {}

@Directive({
  selector: 'ang-cookie-banner-action, [angCookieBannerAction]',
  host: {
    class: 'ang-cookie-banner-action',
    '(click)': 'handleClick()',
  },
})
export class CookieBannerAction {
  readonly closeOnClick = input(true);

  private readonly banner = inject(CookieBanner);

  protected handleClick(): void {
    if (this.closeOnClick() && this.banner.closeOnClick()) {
      this.banner.close();
    }
  }
}

@Component({
  selector: 'ang-cookie-banner',
  imports: [AnyLink, MatButton, MatIcon, TextLink],
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
  readonly opened = model(true);

  readonly privacyPolicy = input<AnyLinkCommand>();

  readonly containerEl = input(undefined, { transform: coerceElement<HTMLElement> });
  readonly reserveSpace = input(true);
  readonly closeOnClick = input(true);

  readonly allowAll = output<void>();
  readonly allowNecessary = output<void>();
  readonly customize = output<void>();

  protected readonly animateOpen = signal(false);
  protected readonly titleId = computed(() => this.titleDir()?.id() ?? this.idGenerator.getId(DEFAULT_TITLE_ID_PREFIX));

  private readonly titleDir = contentChild(CookieBannerTitle, { descendants: true });
  private readonly idGenerator = inject(IdGenerator);

  constructor() {
    afterNextRender(() => this.animateOpen.set(true));
  }

  open(): void {
    this.opened.set(true);
    this.animateOpen.set(true);
  }

  close(): void {
    this.opened.set(false);
  }

  protected handleClick(ref: OutputEmitterRef<void>): void {
    ref.emit();
    if (this.closeOnClick()) {
      this.close();
    }
  }
}
