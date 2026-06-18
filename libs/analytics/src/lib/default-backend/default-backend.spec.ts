import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsPlugin } from 'analytics';
import { AnalyticsPermissions, AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { ANALYTICS_CONFIG } from '../analytics';
import { defaultBackendFactory, DefaultAnalyticsBackendConfig } from './default-backend';

const { analyticsFactoryMock } = vi.hoisted(() => ({
  analyticsFactoryMock: vi.fn(),
}));

vi.mock('analytics', () => ({
  Analytics: analyticsFactoryMock,
}));

describe('defaultBackendFactory', () => {
  function createBackend(config: DefaultAnalyticsBackendConfig, analyticsConfig?: { appName?: string; appVersion?: string }) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ANALYTICS_CONFIG,
          useValue: analyticsConfig ?? { appName: 'AtlasNG', appVersion: '1.2.3' },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: AnalyticsPermissionsManager,
          useValue: {
            permissions: () => AnalyticsPermissions.FULL,
          },
        },
      ],
    });

    return TestBed.runInInjectionContext(() => defaultBackendFactory(config));
  }

  function setNgDevMode(value: unknown): () => void {
    const global = globalThis as Record<string, unknown>;
    const previous = global['ngDevMode'];
    if (value === undefined) {
      delete global['ngDevMode'];
    } else {
      global['ngDevMode'] = value;
    }

    return () => {
      global['ngDevMode'] = previous;
    };
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
    const restore = setNgDevMode(false);
    const backend = { track: vi.fn(), page: vi.fn() };
    analyticsFactoryMock.mockReturnValueOnce(backend);

    createBackend({ endpoint: 'https://api.atlasng.dev/telemetry' });

    const options = getAnalyticsOptions();
    expect(options.debug).toBe(false);
    expect(options.plugins.map((plugin) => plugin.name)).toEqual(['atlasng-event-filter', 'atlasng-telemetry']);

    restore();
  });
});
