import { CdkAccordionItem } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { IdGenerator } from '@atlasng/common';
import { CookiePermissionProvider, ProviderList } from '../provider-list/provider-list';

/**
 * UI metadata for a single cookie permission category.
 */
export interface CookiePermissionInfo {
  /**
   * Category key used to update analytics permissions.
   */
  readonly category: AnalyticsEventCategory;

  /**
   * Visible category title.
   */
  readonly title: string;

  /**
   * Category description shown in the accordion panel.
   */
  readonly description: string;

  /**
   * Marks the category as always enabled.
   */
  readonly required?: boolean;
}

/**
 * Renders a single cookie permission accordion item with toggle and provider links.
 */
@Component({
  selector: 'ang-cookie-permission-item',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule, ProviderList],
  templateUrl: './cookie-permission-item.html',
  styleUrl: './cookie-permission-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-cookie-permission-item',
    '[class.ang-cookie-permission-item--expanded]': 'expanded',
  },
  hostDirectives: [
    {
      directive: CdkAccordionItem,
      inputs: ['expanded'],
      outputs: ['opened', 'closed', 'expandedChange'],
    },
  ],
})
export class CookiePermissionItem {
  /**
   * Display metadata for this cookie category.
   */
  readonly info = input.required<CookiePermissionInfo>();

  /**
   * Two-way model for the category enabled state.
   */
  readonly enabled = model.required<boolean>();

  /**
   * Providers associated with the category.
   */
  readonly providers = input<CookiePermissionProvider[]>([]);

  /**
   * Unique id for the header toggle control.
   */
  protected readonly toggleId = inject(IdGenerator).getId('ang-cookie-permission-item--header-toggle');

  /**
   * Unique id for the expandable body region.
   */
  protected readonly bodyId = inject(IdGenerator).getId('ang-cookie-permission-item--body');

  /**
   * Accessible label for the current toggle action.
   */
  protected readonly stateLabel = computed(() => {
    return `${this.enabled() ? 'Disallow' : 'Allow'} ${this.info().title.toLowerCase()} cookies`;
  });

  /**
   * Indicates whether the accordion section is expanded.
   */
  protected get expanded(): boolean {
    return this.accordionItem.expanded;
  }

  /**
   * Host accordion item directive controlling expand/collapse behavior.
   */
  private readonly accordionItem = inject(CdkAccordionItem);

  /**
   * Opens this accordion item.
   */
  open(): void {
    this.accordionItem.open();
  }

  /**
   * Closes this accordion item.
   */
  close(): void {
    this.accordionItem.close();
  }

  /**
   * Toggles this accordion item between open and closed.
   */
  toggle(): void {
    this.accordionItem.toggle();
  }
}
