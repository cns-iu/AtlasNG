import { TestBed } from '@angular/core/testing';
import { AnalyticsEventCategory, CoreEvents } from '@atlasng/analytics/events';
import {
  AnalyticsPermissions,
  AnalyticsPermissionsManager,
  provideInitialAnalyticsPermissions,
} from '@atlasng/analytics/permissions';
import { Analytics } from './analytics';
import { AnalyticsBackend } from './backend';
import { provideAnalytics, withCustomBackend, withPermissionsConfig } from './provider';

describe('Analytics', () => {
  function createBackend() {
    return {
      page: vi.fn().mockResolvedValue(undefined),
      track: vi.fn().mockResolvedValue(undefined),
    } satisfies AnalyticsBackend;
  }

  function setup(permissions?: AnalyticsPermissions) {
    const backend = createBackend();
    TestBed.configureTestingModule({
      providers: [
        provideAnalytics(
          {},
          withCustomBackend(() => backend),
          withPermissionsConfig({ storage: false, changeEventName: false, storageEvents: false }),
        ),
        ...(permissions ? [provideInitialAnalyticsPermissions(permissions)] : []),
      ],
    });

    return { backend, analytics: TestBed.inject(Analytics), manager: TestBed.inject(AnalyticsPermissionsManager) };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('does nothing if no backend is available', async () => {
    const analytics = TestBed.inject(Analytics);
    await expect(analytics.trackPageView()).resolves.toBeUndefined();
    await expect(analytics.trackEvent(CoreEvents.Click, {})).resolves.toBeUndefined();
  });

  it('forwards events to the backend when the category is granted', async () => {
    const { backend, analytics } = setup(AnalyticsPermissions.FULL);
    const pageViewPayload = { page: 'home' };
    const eventPayload = { button: 'submit' };
    const options = { option: 'value' };

    await expect(analytics.trackPageView(pageViewPayload, options)).resolves.toBeUndefined();
    expect(backend.page).toHaveBeenCalledWith(pageViewPayload, options);

    await expect(analytics.trackEvent(CoreEvents.Click, eventPayload, options)).resolves.toBeUndefined();
    expect(backend.track).toHaveBeenCalledWith(CoreEvents.Click, eventPayload, options);
  });

  it('does not send statistics events to a custom backend under default permissions', async () => {
    const { backend, analytics } = setup();

    await expect(analytics.trackPageView()).resolves.toBeUndefined();
    await expect(analytics.trackEvent(CoreEvents.Click, {})).resolves.toBeUndefined();

    expect(backend.page).not.toHaveBeenCalled();
    expect(backend.track).not.toHaveBeenCalled();
  });

  it('always sends necessary events', async () => {
    const { backend, analytics } = setup();

    await analytics.trackEvent(CoreEvents.Error, { message: 'failed' });

    expect(backend.track).toHaveBeenCalledWith(CoreEvents.Error, { message: 'failed' }, undefined);
  });

  it('follows permission changes', async () => {
    const { backend, analytics, manager } = setup();

    manager.updatePermissions((permissions) => permissions.enableCategory(AnalyticsEventCategory.Statistics));
    await analytics.trackEvent(CoreEvents.Click, {});
    expect(backend.track).toHaveBeenCalledTimes(1);

    manager.setDefaultPermissions();
    await analytics.trackEvent(CoreEvents.Click, {});
    expect(backend.track).toHaveBeenCalledTimes(1);
  });
});
