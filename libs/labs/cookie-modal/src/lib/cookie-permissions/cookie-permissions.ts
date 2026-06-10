import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { AnalyticsEventCategory, AnalyticsEventCategoryPermissions } from '@atlasng/analytics/events';
import { CookiePermissionInfo, CookiePermissionItem } from '../cookie-permission-item/cookie-permission-item';
import { CookiePermissionProvidersByCategory } from '../provider-list/provider-list';

const DEFAULT_INFO: CookiePermissionInfo[] = [
  {
    category: AnalyticsEventCategory.Necessary,
    title: 'Necessary',
    description: `Necessary cookies and similar technologies make websites
      usable by enabling basic functions like page navigation.
      The website cannot function properly without this feature.`,
    required: true,
  },
  {
    category: AnalyticsEventCategory.Preferences,
    title: 'Preferences',
    description: `Preference cookies remember your choices, like your preferred language or display settings.
      They help the site behave in a way that matches your preferences.`,
  },
  {
    category: AnalyticsEventCategory.Statistics,
    title: 'Statistics',
    description: `We use statistics cookies and similar technologies to collect aggregated,
      anonymous data that help us understand traffic patterns, popular pages, and overall performance.
      This information supports continuous improvements to our website.`,
  },
  {
    category: AnalyticsEventCategory.Marketing,
    title: 'Marketing',
    description: `These cookies are used by third-party services, such as YouTube, to enable embedded video playback.
      If these cookies are disabled, embedded videos will not play on this site.`,
  },
];

@Component({
  selector: 'ang-cookie-permissions',
  imports: [CdkAccordionModule, MatDividerModule, CookiePermissionItem],
  templateUrl: './cookie-permissions.html',
  styleUrl: './cookie-permissions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ang-cookie-permissions',
  },
})
export class CookiePermissions {
  readonly permissions = model.required<AnalyticsEventCategoryPermissions>();
  readonly info = input(DEFAULT_INFO);
  readonly providers = input<CookiePermissionProvidersByCategory>({});

  protected updatePermissions(category: AnalyticsEventCategory, value: boolean): void {
    this.permissions.update((currentPermissions) => ({
      ...currentPermissions,
      [category]: value,
    }));
  }
}
