import { CdkAccordionItem } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, inject, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { IdGenerator } from '@atlasng/common';
import { CookiePermissionProvider, ProviderList } from '../provider-list/provider-list';

export interface CookiePermissionInfo {
  readonly category: AnalyticsEventCategory;
  readonly title: string;
  readonly description: string;
  readonly required?: boolean;
}

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
  readonly info = input.required<CookiePermissionInfo>();
  readonly enabled = model.required<boolean>();
  readonly providers = input<CookiePermissionProvider[]>([]);

  protected readonly toggleId = inject(IdGenerator).getId('ang-cookie-permission-item--header-toggle');
  protected readonly bodyId = inject(IdGenerator).getId('ang-cookie-permission-item--body');

  protected get expanded(): boolean {
    return this.accordionItem.expanded;
  }

  private readonly accordionItem = inject(CdkAccordionItem);

  open(): void {
    this.accordionItem.open();
  }

  close(): void {
    this.accordionItem.close();
  }

  toggle(): void {
    this.accordionItem.toggle();
  }
}
