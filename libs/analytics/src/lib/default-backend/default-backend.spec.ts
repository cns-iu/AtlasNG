import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsPermissions, AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { AnalyticsPlugin } from 'analytics';
import { ANALYTICS_CONFIG } from '../analytics';
import { DefaultAnalyticsBackendConfig, defaultBackendFactory } from './default-backend';

describe('defaultBackendFactory', () => {
  const analyticsFactoryMock = vi.fn();

  function configureProviders(analyticsConfig?: { appName?: string; appVersion?: string }) {
    TestBed.configureTestingModule({
      providers: [
        ANALYTICS_CONFIG.provide(analyticsConfig ?? { appName: 'AtlasNG', appVersion: '1.2.3' }),
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: AnalyticsPermissionsManager,
          useValue: {
            permissions: () => AnalyticsPermissions.FULL,
          },
        },
      ],
    });
  }

  function createBackend(
    config: DefaultAnalyticsBackendConfig,
    analyticsConfig?: { appName?: string; appVersion?: string },
  ) {
    configureProviders(analyticsConfig);

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
  } {
    return analyticsFactoryMock.mock.calls[0]?.[0] as {
      app: string;
      version: string;
      debug: boolean;
      plugins: AnalyticsPlugin[];
    };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('should create Analytics backend with built-in plugins first', () => {
    const backend = { track: vi.fn(), page: vi.fn() };
    analyticsFactoryMock.mockReturnValueOnce(backend);
    const customPlugin = { name: 'custom-plugin' } as AnalyticsPlugin;

    const result = createBackend({
      endpoint: 'https://api.atlasng.dev/telemetry',
      plugins: [customPlugin],
    });

    expect(result).toBe(backend);

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

  it('should resolve custom plugins from a factory function', () => {
    const backend = { track: vi.fn(), page: vi.fn() };
    analyticsFactoryMock.mockReturnValueOnce(backend);
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
    const backend = { track: vi.fn(), page: vi.fn() };
    analyticsFactoryMock.mockReturnValueOnce(backend);

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
});
