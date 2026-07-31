import { AnalyticsEventCategory, createAnalyticsEvent } from '@atlasng/analytics/events';
import { AnalyticsPermissions } from './permissions';

describe('Permissions', () => {
  const defaultPermissions = {
    [AnalyticsEventCategory.Necessary]: true,
    [AnalyticsEventCategory.Statistics]: false,
    [AnalyticsEventCategory.Preferences]: false,
    [AnalyticsEventCategory.Marketing]: false,
  };

  const fullPermissions = {
    [AnalyticsEventCategory.Necessary]: true,
    [AnalyticsEventCategory.Statistics]: true,
    [AnalyticsEventCategory.Preferences]: true,
    [AnalyticsEventCategory.Marketing]: true,
  };

  it('exposes the default and full permission sets', () => {
    expect(AnalyticsPermissions.DEFAULT.toJSON()).toEqual(defaultPermissions);
    expect(AnalyticsPermissions.FULL.toJSON()).toEqual(fullPermissions);
  });

  it('treats updates as immutable copies and keeps necessary permissions enabled', () => {
    const base = new AnalyticsPermissions();

    const enabledStatistics = base.enableCategory(AnalyticsEventCategory.Statistics);
    const disabledNecessary = enabledStatistics.disableCategory(AnalyticsEventCategory.Necessary);
    const toggledPreferences = enabledStatistics.toggleCategory(AnalyticsEventCategory.Preferences);
    const setMarketingFalse = toggledPreferences.setCategory(AnalyticsEventCategory.Marketing, false);

    expect(base.isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(false);
    expect(enabledStatistics.isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(true);
    expect(enabledStatistics.isCategoryEnabled(AnalyticsEventCategory.Necessary)).toBe(true);
    expect(disabledNecessary.isCategoryEnabled(AnalyticsEventCategory.Necessary)).toBe(true);
    expect(toggledPreferences.isCategoryEnabled(AnalyticsEventCategory.Preferences)).toBe(true);
    expect(toggledPreferences.isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(true);
    expect(setMarketingFalse.isCategoryEnabled(AnalyticsEventCategory.Marketing)).toBe(false);
    expect(base.equals(AnalyticsPermissions.DEFAULT)).toBe(true);
    expect(base.equals(enabledStatistics)).toBe(false);
  });

  it('checks event permissions through the event category', () => {
    const permissions = AnalyticsPermissions.DEFAULT.enableCategory(AnalyticsEventCategory.Marketing);
    const marketingEvent = createAnalyticsEvent('newsletter-signup', AnalyticsEventCategory.Marketing);
    const statisticsEvent = createAnalyticsEvent('page-view', AnalyticsEventCategory.Statistics);

    expect(permissions.isEventEnabled(marketingEvent)).toBe(true);
    expect(permissions.isEventEnabled(statisticsEvent)).toBe(false);
  });

  it('parses JSON with defaults and coerces category values to booleans', () => {
    const json = JSON.stringify({
      [AnalyticsEventCategory.Necessary]: false,
      [AnalyticsEventCategory.Statistics]: 1,
      [AnalyticsEventCategory.Preferences]: '',
      [AnalyticsEventCategory.Marketing]: 'enabled',
    });

    const permissions = AnalyticsPermissions.fromJSON(json);

    expect(permissions.toJSON()).toEqual({
      [AnalyticsEventCategory.Necessary]: true,
      [AnalyticsEventCategory.Statistics]: true,
      [AnalyticsEventCategory.Preferences]: false,
      [AnalyticsEventCategory.Marketing]: true,
    });
  });

  it('parses JSON against a custom default permission set', () => {
    const permissions = AnalyticsPermissions.fromJSON(
      JSON.stringify({ [AnalyticsEventCategory.Preferences]: false }),
      AnalyticsPermissions.FULL,
    );

    expect(permissions.toJSON()).toEqual({
      [AnalyticsEventCategory.Necessary]: true,
      [AnalyticsEventCategory.Statistics]: true,
      [AnalyticsEventCategory.Preferences]: false,
      [AnalyticsEventCategory.Marketing]: true,
    });
  });

  it('returns undefined for invalid JSON in the safe parser', () => {
    expect(AnalyticsPermissions.tryFromJSON('not-json')).toBeUndefined();
    expect(AnalyticsPermissions.tryFromJSON('null')).toBeUndefined();
  });

  it('serializes to a plain JSON object', () => {
    expect(JSON.stringify(AnalyticsPermissions.FULL)).toBe(JSON.stringify(fullPermissions));
  });
});
