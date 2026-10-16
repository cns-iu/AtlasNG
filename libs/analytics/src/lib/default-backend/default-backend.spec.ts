import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoreEvents } from '@atlasng/analytics/events';
import {
  AnalyticsPermissions,
  AnalyticsPermissionsManager,
  AnalyticsPermissionedStorage,
  provideAnalyticsPermissionedStorageKeys,
} from '@atlasng/analytics/permissions';
import { LOCAL_STORAGE } from '@atlasng/core';
import { Analytics, AnalyticsPlugin } from 'analytics';
import { parse } from 'qs';
import { ANALYTICS_CONFIG } from '../analytics';
import { ANONYMOUS_ID_KEY, ANONYMOUS_ID_STORAGE_KEY, ANONYMOUS_ID_STORAGE_KEYS } from './anonymous-id';
import { DefaultAnalyticsBackendConfig, defaultBackendFactory } from './default-backend';
import { DefaultBackendEventFilterMethods } from './event-filter-plugin';

describe('defaultBackendFactory', () => {
  const analyticsFactoryMock = vi.fn();
  const permissions = signal(AnalyticsPermissions.FULL);
  let localStorageMock: Storage;

  function createLocalStorage(): Storage {
    const data = new Map<string, string>();
    return {
      get length() {
        return data.size;
      },
      clear: () => data.clear(),
      getItem: (key: string) => data.get(key) ?? null,
      key: (index: number) => Array.from(data.keys())[index] ?? null,
      removeItem: (key: string) => {
        data.delete(key);
      },
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
  }

  function configureProviders(analyticsConfig?: { appName?: string; appVersion?: string }, platformId = 'browser') {
    TestBed.configureTestingModule({
      providers: [
        ANALYTICS_CONFIG.provide(analyticsConfig ?? { appName: 'AtlasNG', appVersion: '1.2.3' }),
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: LOCAL_STORAGE, useValue: localStorageMock },
        provideAnalyticsPermissionedStorageKeys(ANONYMOUS_ID_STORAGE_KEYS),
        {
          provide: AnalyticsPermissionsManager,
          useValue: { permissions },
        },
      ],
    });
  }

  function createBackend(
    config: DefaultAnalyticsBackendConfig,
    analyticsConfig?: { appName?: string; appVersion?: string },
    platformId?: string,
  ) {
    configureProviders(analyticsConfig, platformId);
    return TestBed.runInInjectionContext(() => defaultBackendFactory(config, analyticsFactoryMock));
  }

  function runWithProdMode<T>(callback: () => T): T {
    const global = globalThis as Record<string, unknown>;
    const previous = global['ngDevMode'];
    global['ngDevMode'] = false;
    try {
      return callback();
    } finally {
      global['ngDevMode'] = previous;
    }
  }

  function getAnalyticsOptions(): {
    app: string;
    version: string;
    debug: boolean;
    plugins: AnalyticsPlugin[];
    storage: AnalyticsPermissionedStorage;
  } {
    return analyticsFactoryMock.mock.calls[0]?.[0];
  }

  beforeEach(() => {
    permissions.set(AnalyticsPermissions.FULL);
    localStorageMock = createLocalStorage();
    // Like the `analytics` package, expose each plugin's custom methods under `instance.plugins[name]`
    analyticsFactoryMock.mockImplementation((config: { plugins: AnalyticsPlugin[] }) => ({
      track: vi.fn().mockResolvedValue(undefined),
      page: vi.fn().mockResolvedValue(undefined),
      plugins: Object.fromEntries(
        config.plugins.filter((plugin) => plugin['methods']).map((plugin) => [plugin.name, plugin['methods']]),
      ),
    }));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('should create Analytics backend with built-in plugins first', () => {
    const customPlugin = { name: 'custom-plugin' } as AnalyticsPlugin;

    createBackend({
      endpoint: 'https://api.atlasng.dev/telemetry',
      plugins: [customPlugin],
    });

    const options = getAnalyticsOptions();
    expect(options.app).toBe('AtlasNG');
    expect(options.version).toBe('1.2.3');
    expect(options.debug).toBe(true);
    expect(options.plugins.map((plugin) => plugin.name)).toEqual([
      'atlasng-event-filter',
      'atlasng-telemetry',
      'custom-plugin',
    ]);
  });

  it('should mark calls made through the backend', async () => {
    const backend = createBackend({ endpoint: 'https://api.atlasng.dev/telemetry' });
    const instance = analyticsFactoryMock.mock.results[0]?.value;

    await backend.page({ title: 'Home' }, { custom: 1 });
    await backend.track(CoreEvents.Click, { id: 'cta' });

    const { createSafeOptions } = instance.plugins['atlasng-event-filter'] as DefaultBackendEventFilterMethods;
    expect(instance.page).toHaveBeenCalledWith({ title: 'Home' }, createSafeOptions({ custom: 1 }));
    expect(instance.track).toHaveBeenCalledWith(CoreEvents.Click, { id: 'cta' }, createSafeOptions());
  });

  it('should resolve custom plugins from a factory function', () => {
    const customPluginA = { name: 'custom-a' } as AnalyticsPlugin;
    const customPluginB = { name: 'custom-b' } as AnalyticsPlugin;
    const pluginsFactory = vi.fn(() => [customPluginA, customPluginB]);

    createBackend({
      endpoint: 'https://api.atlasng.dev/telemetry',
      plugins: pluginsFactory,
    });

    expect(pluginsFactory).toHaveBeenCalledTimes(1);
    const options = getAnalyticsOptions();
    expect(options.plugins.map((plugin) => plugin.name)).toEqual([
      'atlasng-event-filter',
      'atlasng-telemetry',
      'custom-a',
      'custom-b',
    ]);
  });

  it('should set debug to false when ngDevMode is false', () => {
    configureProviders();

    runWithProdMode(() => {
      TestBed.runInInjectionContext(() =>
        defaultBackendFactory({ endpoint: 'https://api.atlasng.dev/telemetry' }, analyticsFactoryMock),
      );

      const options = getAnalyticsOptions();
      expect(options.debug).toBe(false);
      expect(options.plugins.map((plugin) => plugin.name)).toEqual(['atlasng-event-filter', 'atlasng-telemetry']);
    });
  });

  it('should keep the anonymous ID in memory until statistics consent is granted', () => {
    permissions.set(AnalyticsPermissions.DEFAULT);
    createBackend({ endpoint: 'https://api.atlasng.dev/telemetry' });
    const { storage } = getAnalyticsOptions();

    const id = storage.getItem(ANONYMOUS_ID_KEY);
    expect(localStorageMock.getItem(ANONYMOUS_ID_STORAGE_KEY)).toBeNull();

    permissions.set(AnalyticsPermissions.FULL);
    TestBed.tick();
    expect(localStorageMock.getItem(ANONYMOUS_ID_STORAGE_KEY)).toBe(JSON.stringify(id));

    permissions.set(AnalyticsPermissions.DEFAULT);
    TestBed.tick();
    expect(localStorageMock.getItem(ANONYMOUS_ID_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(ANONYMOUS_ID_KEY)).toBe(id);
  });

  it('should not use local storage on the server', () => {
    createBackend({ endpoint: 'https://api.atlasng.dev/telemetry' }, undefined, 'server');
    const { storage } = getAnalyticsOptions();

    expect(storage.getItem(ANONYMOUS_ID_KEY)).toEqual(expect.any(String));
    expect(localStorageMock.length).toBe(0);
  });

  it('should only write the anonymous ID through the consent storage and never set cookies with the real analytics package', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const cookieSpy = vi.spyOn(document, 'cookie', 'set');
    configureProviders();

    const backend = TestBed.runInInjectionContext(() =>
      defaultBackendFactory({ endpoint: 'https://api.atlasng.dev/telemetry' }),
    );
    expect(backend).toBeDefined();

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(cookieSpy).not.toHaveBeenCalled();
    expect(localStorageMock.getItem(ANONYMOUS_ID_STORAGE_KEY)).toEqual(expect.any(String));
  });

  it('should ignore identity and events from analytics URL parameters', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);
    const originalUrl = location.href;
    history.replaceState(
      null,
      '',
      '?an_aid=from-url&an_uid=someone&an_trait_email=a%40b.c&an_event=necessary%3Ainjected',
    );
    configureProviders();

    try {
      let storage: AnalyticsPermissionedStorage | undefined;
      const backend = TestBed.runInInjectionContext(() =>
        defaultBackendFactory({ endpoint: 'https://api.atlasng.dev/telemetry' }, (config) => {
          storage = config.storage;
          return Analytics(config);
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(fetchSpy).not.toHaveBeenCalled();

      await backend.track(CoreEvents.Error, { message: 'boom' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const query = parse((fetchSpy.mock.calls[0]?.[0] as string).split('?')[1], { allowDots: true });
      expect(query['sessionId']).toBe(storage?.getItem(ANONYMOUS_ID_KEY));
      expect(query['sessionId']).not.toBe('from-url');
      expect(storage?.getItem('__user_id')).toBe('someone');
      expect(localStorageMock.length).toBe(1);
    } finally {
      history.replaceState(null, '', originalUrl);
      vi.unstubAllGlobals();
    }
  });

  it('should pass the key group mapping through the real analytics package', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);
    configureProviders();

    try {
      const backend = TestBed.runInInjectionContext(() =>
        defaultBackendFactory({
          endpoint: 'https://api.atlasng.dev/telemetry',
          getKeyGroup: (key) => (key === ' ' ? 'space' : undefined),
        }),
      );

      await backend.track(CoreEvents.Keyboard, {
        trigger: 'keydown',
        triggerData: new KeyboardEvent('keydown', { key: ' ' }),
      });

      const query = parse((fetchSpy.mock.calls[0]?.[0] as string).split('?')[1], { allowDots: true });
      expect(query['triggerData']).toEqual({ type: 'keydown', keyGroup: 'space' });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
