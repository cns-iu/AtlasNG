import { TestBed } from '@angular/core/testing';
import { ANALYTICS_BACKEND, provideAnalytics, withPermissionsConfig } from '@atlasng/analytics';
import { CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPermissionedStorage } from '@atlasng/analytics/permissions';
import { ANONYMOUS_ID_KEY } from './anonymous-id';
import { withDefaultBackend } from './provider';

describe('withDefaultBackend', () => {
  const DEFAULT_BACKEND_CONFIG = { endpoint: '' };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should provide the default backend', () => {
    const providers = provideAnalytics({ appName: 'DefaultBackendTest' }, withDefaultBackend(DEFAULT_BACKEND_CONFIG));
    TestBed.configureTestingModule({ providers: [providers] });

    const backend = TestBed.inject(ANALYTICS_BACKEND);
    expect(backend).toBeDefined();
    expect(backend.page).toBeDefined();
    expect(backend.track).toBeDefined();
    expect(typeof backend.page).toBe('function');
    expect(typeof backend.track).toBe('function');
  });

  it('should register the anonymous ID with the permissioned storage in the default backend', () => {
    TestBed.configureTestingModule({
      providers: [
        provideAnalytics(
          { appName: 'DefaultBackendTest' },
          withDefaultBackend(DEFAULT_BACKEND_CONFIG),
          withPermissionsConfig({ storage: false, changeEventName: false, storageEvents: false }),
        ),
      ],
    });

    const storage = TestBed.inject(AnalyticsPermissionedStorage);
    storage.setItem(ANONYMOUS_ID_KEY, 'from-url');

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('should drop statistics events in the default backend under default permissions', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);
    const providers = provideAnalytics(
      {},
      withDefaultBackend({ endpoint: 'https://api.atlasng.dev/t' }),
      withPermissionsConfig({ storage: false, changeEventName: false, storageEvents: false }),
    );
    TestBed.configureTestingModule({ providers: [providers] });

    try {
      const backend = TestBed.inject(ANALYTICS_BACKEND);
      void backend.track(CoreEvents.Click, {});
      await backend.track(CoreEvents.Error, { message: 'boom' });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(new URL(fetchSpy.mock.calls[0]?.[0] as string).searchParams.get('event')).toBe(CoreEvents.Error);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
