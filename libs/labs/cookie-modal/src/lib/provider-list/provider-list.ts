import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EventScope } from '@atlasng/analytics';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnyLink, IdGenerator } from '@atlasng/common';
import { TextLink } from '@atlasng/design-system/links/text-link';

/**
 * Represents a single provider link shown in the cookie permissions list.
 */
export interface CookiePermissionProvider {
  /**
   * Human-readable provider label.
   */
  label: string;

  /**
   * Absolute or relative URL for the provider's privacy information.
   */
  href: string;
}

/**
 * Groups cookie permission providers by analytics event category.
 */
export type CookiePermissionProvidersByCategory = Partial<Record<AnalyticsEventCategory, CookiePermissionProvider[]>>;

/**
 * Renders a list of cookie providers with links to their privacy details.
 */
@Component({
  selector: 'ang-providers-list',
  imports: [MatIconModule, AnyLink, TextLink, EventScope],
  templateUrl: './provider-list.html',
  styleUrl: './provider-list.scss',
  host: {
    class: 'ang-provider-list',
    '[class.ang-provider-list--empty]': 'providers().length === 0',
  },
})
export class ProviderList {
  /**
   * Providers displayed in the list.
   */
  readonly providers = input<CookiePermissionProvider[]>([]);

  /**
   * Generates unique IDs for list item accessibility attributes.
   */
  readonly #idGenerator = inject(IdGenerator);

  /**
   * Providers paired with the ids of their label and link text. The link is labelled by both,
   * so its accessible name names the provider.
   */
  protected readonly items = computed(() =>
    this.providers().map((provider) => ({
      provider,
      labelId: this.#idGenerator.getId('ang-provider-list--label'),
      linkTextId: this.#idGenerator.getId('ang-provider-list--link-text'),
    })),
  );
}
