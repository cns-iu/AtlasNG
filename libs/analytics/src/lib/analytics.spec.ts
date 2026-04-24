import { TestBed } from '@angular/core/testing';
import { CoreEvents } from '@atlasng/analytics/events';
import { Analytics } from './analytics';
import { ANALYTICS_BACKEND } from './backend';

describe('Analytics', () => {
  it('does nothing if no backend is available', async () => {
    const analytics = TestBed.inject(Analytics);
    await expect(analytics.logPageView()).resolves.toBeUndefined();
    await expect(analytics.logEvent(CoreEvents.Click, {})).resolves.toBeUndefined();
  });

  it('forwards events to the backend', async () => {
    const pageViewPayload = { page: 'home' };
    const eventPayload = { button: 'submit' };
    const options = { option: 'value' };
    const backend = {
      page: vi.fn().mockResolvedValue(undefined),
      track: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ANALYTICS_BACKEND, useValue: backend }],
    });
    const analytics = TestBed.inject(Analytics);

    await expect(analytics.logPageView(pageViewPayload, options)).resolves.toBeUndefined();
    expect(backend.page).toHaveBeenCalledWith(pageViewPayload, options);

    await expect(analytics.logEvent(CoreEvents.Click, eventPayload, options)).resolves.toBeUndefined();
    expect(backend.track).toHaveBeenCalledWith(CoreEvents.Click, eventPayload, options);
  });
});
