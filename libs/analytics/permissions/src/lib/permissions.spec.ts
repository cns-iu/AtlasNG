import { AnalyticsEventCategory, createAnalyticsEvent } from '@atlasng/analytics/events';
import { Permissions } from './permissions';

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
    expect(Permissions.DEFAULT.toJSON()).toEqual(defaultPermissions);
    expect(Permissions.FULL.toJSON()).toEqual(fullPermissions);
  });

  it('treats updates as immutable copies and keeps necessary permissions enabled', () => {
    const base = new Permissions();

    const enabledStatistics = base.enableCategory(AnalyticsEventCategory.Statistics);
    const disabledNecessary = enabledStatistics.disableCategory(AnalyticsEventCategory.Necessary);
    const toggledPreferences = enabledStatistics.toggleCategory(AnalyticsEventCategory.Preferences);

    expect(base.isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(false);
    expect(enabledStatistics.isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(true);
    expect(enabledStatistics.isCategoryEnabled(AnalyticsEventCategory.Necessary)).toBe(true);
    expect(disabledNecessary.isCategoryEnabled(AnalyticsEventCategory.Necessary)).toBe(true);
    expect(toggledPreferences.isCategoryEnabled(AnalyticsEventCategory.Preferences)).toBe(true);
    expect(toggledPreferences.isCategoryEnabled(AnalyticsEventCategory.Statistics)).toBe(true);
    expect(base.equals(Permissions.DEFAULT)).toBe(true);
    expect(base.equals(enabledStatistics)).toBe(false);
  });

  it('checks event permissions through the event category', () => {
    const permissions = Permissions.DEFAULT.enableCategory(AnalyticsEventCategory.Marketing);
    const marketingEvent = createAnalyticsEvent('newsletter-signup', AnalyticsEventCategory.Marketing);
    const statisticsEvent = createAnalyticsEvent('page-view', AnalyticsEventCategory.Statistics);

    expect(permissions.isEventEnabled(marketingEvent)).toBe(true);
    expect(permissions.isEventEnabled(statisticsEvent)).toBe(false);
  });

  it('parses JSON with defaults and coerces category values to booleans', () => {
    const json = JSON.stringify({
      [AnalyticsEventCategory.Statistics]: 1,
      [AnalyticsEventCategory.Preferences]: '',
      [AnalyticsEventCategory.Marketing]: 'enabled',
    });

    const permissions = Permissions.fromJSON(json);

    expect(permissions.toJSON()).toEqual({
      [AnalyticsEventCategory.Necessary]: true,
      [AnalyticsEventCategory.Statistics]: true,
      [AnalyticsEventCategory.Preferences]: false,
      [AnalyticsEventCategory.Marketing]: true,
    });
  });

  it('parses JSON against a custom default permission set', () => {
    const permissions = Permissions.fromJSON(
      JSON.stringify({ [AnalyticsEventCategory.Preferences]: false }),
      Permissions.FULL,
    );

    expect(permissions.toJSON()).toEqual({
      [AnalyticsEventCategory.Necessary]: true,
      [AnalyticsEventCategory.Statistics]: true,
      [AnalyticsEventCategory.Preferences]: false,
      [AnalyticsEventCategory.Marketing]: true,
    });
  });

  it('returns undefined for invalid JSON in the safe parser', () => {
    expect(Permissions.tryFromJSON('not-json')).toBeUndefined();
    expect(Permissions.tryFromJSON('null')).toBeUndefined();
  });

  it('serializes to a plain JSON object', () => {
    expect(JSON.stringify(Permissions.FULL)).toBe(JSON.stringify(fullPermissions));
  });
});
