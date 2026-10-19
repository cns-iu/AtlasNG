import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsEventCategory, CoreEvents } from '@atlasng/analytics/events';
import {
  AnalyticsPermissionedStorage,
  AnalyticsPermissions,
  AnalyticsPermissionsManager,
} from '@atlasng/analytics/permissions';
import { ANALYTICS_CONFIG } from './analytics';
import { ANALYTICS_BACKEND, AnalyticsBackend } from './backend';
import {
  AnalyticsFeatureKind,
  provideAnalytics,
  withCustomBackend,
  withGlobalErrorHandler,
  withInitialPermissions,
  withPermissionedStorageConfig,
  withPermissionedStorageKeys,
  withPermissionsConfig,
} from './provider';

describe('provideAnalytics', () => {
  function runWithProdMode<T>(callback: () => T): T {
    const global = globalThis as Record<string, unknown>;
    const originalNgDevMode = global['ngDevMode'];
    global['ngDevMode'] = false;
    try {
      return callback();
    } finally {
      global['ngDevMode'] = originalNgDevMode;
    }
  }

  function createMockBackend(): AnalyticsBackend {
    return {
      page: vi.fn().mockResolvedValue(undefined),
      track: vi.fn().mockResolvedValue(undefined),
    };
  }

  it('should provide the analytics config', () => {
    const providers = provideAnalytics({ appName: 'TestApp' }, withCustomBackend(createMockBackend));
    TestBed.configureTestingModule({ providers: [providers] });

    const config = TestBed.inject(ANALYTICS_CONFIG.token);
    expect(config.appName).toBe('TestApp');
  });

  it('should provide a global error handler', () => {
    const backend = createMockBackend();
    const providers = provideAnalytics(
      undefined,
      withGlobalErrorHandler(),
      withCustomBackend(() => backend),
    );
    TestBed.configureTestingModule({ providers: [providers] });

    const errorHandler = TestBed.inject(ErrorHandler);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');

    errorHandler.handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled error', error);
    expect(backend.track).toHaveBeenCalledWith(
      CoreEvents.Error,
      { message: 'Unhandled error', reason: error },
      undefined,
    );
  });

  it('should provide the custom backend', () => {
    const backend = createMockBackend();
    const providers = provideAnalytics(
      {},
      withCustomBackend(() => backend),
    );
    TestBed.configureTestingModule({ providers: [providers] });

    const injectedBackend = TestBed.inject(ANALYTICS_BACKEND);
    expect(injectedBackend).toBe(backend);
  });

  it('should throw if multiple backends are provided', () => {
    const backend1 = createMockBackend();
    const backend2 = createMockBackend();
    const setup = () =>
      provideAnalytics(
        {},
        withCustomBackend(() => backend1),
        withCustomBackend(() => backend2),
      );

    expect(setup).toThrow();
  });

  it('should throw if a custom backend is provided together with the default backend', () => {
    const backend = createMockBackend();
    const setup = () =>
      provideAnalytics(
        {},
        { kind: AnalyticsFeatureKind.DefaultBackend, providers: [] },
        withCustomBackend(() => backend),
      );

    expect(setup).toThrow();
  });

  it('should throw if no backend is provided', () => {
    const setup = () => provideAnalytics({});

    expect(setup).toThrow();
  });

  it('should not check for backend misconfiguration when in prod mode', () => {
    runWithProdMode(() => {
      const setup = () => provideAnalytics();

      expect(setup).not.toThrow();
    });
  });

  it('should configure the permissions manager', () => {
    const backend = createMockBackend();
    const providers = provideAnalytics(
      {},
      withCustomBackend(() => backend),
      withPermissionsConfig({
        changeEventName: false,
        storage: false,
        storageKey: 'custom-permissions-key',
        storageEvents: false,
      }),
    );

    TestBed.configureTestingModule({ providers: [providers] });

    const manager = TestBed.inject(AnalyticsPermissionsManager);
    expect(manager.config.changeEventName).toBe(false);
    expect(manager.config.storage).toBe(false);
    expect(manager.config.storageKey).toBe('custom-permissions-key');
    expect(manager.config.storageEvents).toBe(false);
  });

  it('should set the initial permissions', () => {
    const backend = createMockBackend();
    const initialPermissions = AnalyticsPermissions.DEFAULT.enableCategory(AnalyticsEventCategory.Preferences);
    const providers = provideAnalytics(
      {},
      withCustomBackend(() => backend),
      withPermissionsConfig({ storage: false, changeEventName: false, storageEvents: false }),
      withInitialPermissions(initialPermissions),
    );

    TestBed.configureTestingModule({ providers: [providers] });

    expect(TestBed.inject(AnalyticsPermissionsManager).permissions()).toBe(initialPermissions);
  });

  it('should configure the permissioned storage and register its keys', () => {
    const backend = createMockBackend();
    const storage = window.sessionStorage;
    storage.removeItem('stored-theme');
    const providers = provideAnalytics(
      {},
      withCustomBackend(() => backend),
      withPermissionsConfig({ storage: false, changeEventName: false, storageEvents: false }),
      withInitialPermissions(AnalyticsPermissions.FULL),
      withPermissionedStorageConfig({ storage }),
      withPermissionedStorageKeys({ theme: { key: 'stored-theme', category: AnalyticsEventCategory.Preferences } }),
    );

    TestBed.configureTestingModule({ providers: [providers] });

    const permissionedStorage = TestBed.inject(AnalyticsPermissionedStorage);
    permissionedStorage.setItem('theme', 'dark');

    expect(permissionedStorage.config.storage).toBe(storage);
    expect(storage.getItem('stored-theme')).toBe('"dark"');
    storage.removeItem('stored-theme');
  });
});
