import { TestBed } from '@angular/core/testing';
import { ANALYTICS_CONFIG } from './analytics';
import { ANALYTICS_BACKEND, AnalyticsBackend } from './backend';
import { provideAnalytics, withCustomBackend, withDefaultBackend, withGlobalErrorHandler } from './provider';
import { ErrorHandler } from '@angular/core';
import { CoreEvents } from '@atlasng/analytics/events';

describe('provideAnalytics', () => {
  function enableProdMode() {
    const global = globalThis as Record<string, unknown>;
    const originalNgDevMode = global['ngDevMode'];
    global['ngDevMode'] = false;
    return () => {
      global['ngDevMode'] = originalNgDevMode;
    };
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

    const config = TestBed.inject(ANALYTICS_CONFIG);
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

  it.todo('should provide the default backend');

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
        withDefaultBackend(),
        withCustomBackend(() => backend),
      );

    expect(setup).toThrow();
  });

  it('should throw if no backend is provided', () => {
    const setup = () => provideAnalytics({});

    expect(setup).toThrow();
  });

  it('should not check for backend misconfiguration when in prod mode', () => {
    const restoreDevMode = enableProdMode();
    const setup = () => provideAnalytics();

    expect(setup).not.toThrow();
    restoreDevMode();
  });
});
