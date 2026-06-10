import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnyLink, IdGenerator } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/text-link';

export interface CookiePermissionProvider {
  label: string;
  href: string;
}

export type CookiePermissionProvidersByCategory = Partial<Record<AnalyticsEventCategory, CookiePermissionProvider[]>>;

@Component({
  selector: 'ang-providers-list',
  imports: [MatIconModule, AnyLink, TextLink],
  templateUrl: './provider-list.html',
  styleUrl: './provider-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-provider-list',
    '[class.ang-provider-list--empty]': 'providers().length === 0',
  },
})
export class ProviderList {
  readonly providers = input<CookiePermissionProvider[]>([]);

  protected readonly idGenerator = inject(IdGenerator);
}
