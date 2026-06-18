import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CoreEvents } from '@atlasng/analytics/events';
import { parse } from 'qs';
import { telemetryPlugin, TelemetryPluginConfig } from './telemetry-plugin';
import { AnyPluginMethodArgs } from './types';

describe('telemetryPlugin', () => {
  function createPlugin(config: TelemetryPluginConfig) {
    const providers = config.useHttpClient ? [provideHttpClient(), provideHttpClientTesting()] : [];
    TestBed.configureTestingModule({ providers });

    const plugin = TestBed.runInInjectionContext(() => telemetryPlugin(config));
    return { plugin, config };
  }

  function createArgs(config: TelemetryPluginConfig): Omit<AnyPluginMethodArgs<TelemetryPluginConfig>, 'payload'> {
    return {
      config,
      instance: {
        getState: (key: string) => {
          if (key === 'context.app') {
            return 'AtlasNG';
          }
          if (key === 'context.version') {
            return '1.2.3';
          }
          return undefined;
        },
      } as never,
      plugins: {},
    };
  }

  function parseQueryFromUrl(url: string): Record<string, unknown> {
    const query = url.split('?')[1] ?? '';
    return parse(query, { allowDots: true }) as Record<string, unknown>;
  }

  afterEach(() => {
    const httpTesting = TestBed.inject(HttpTestingController, null);
    httpTesting?.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should expose plugin name and config', () => {
    const config = { endpoint: '/telemetry' };
    const { plugin } = createPlugin(config);

    expect(plugin.name).toBe('atlasng-telemetry');
    expect(plugin.config).toBe(config);
  });

  it('should send track telemetry using fetch by default', () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);

    const { plugin, config } = createPlugin({ endpoint: 'https://api.atlasng.dev/t' });
    const track = plugin['track'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;
    const args = {
      ...createArgs(config),
      payload: {
        type: 'track',
        event: CoreEvents.Click,
        properties: {
          path: '/docs',
          trigger: 'button',
          triggerData: { id: 'cta' },
          label: 'Get started',
        },
        anonymousId: 'session-123',
      },
    } as AnyPluginMethodArgs<TelemetryPluginConfig>;

    track?.(args);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith('https://api.atlasng.dev/t?')).toBe(true);
    expect(init).toEqual({ method: 'GET', cache: 'no-store', keepalive: true });

    const parsed = parseQueryFromUrl(url);
    expect(parsed['sv']).toBe('0');
    expect(parsed['sessionId']).toBe('session-123');
    expect(parsed['app']).toBe('AtlasNG');
    expect(parsed['version']).toBe('1.2.3');
    expect(parsed['event']).toBe(CoreEvents.Click);
    expect(parsed['path']).toBe('/docs');
    expect(parsed['trigger']).toBe('button');
    expect(parsed['triggerData']).toEqual({ id: 'cta' });
    expect(parsed['e']).toEqual({ label: 'Get started' });
  });

  it('should send page and identify telemetry with core events', () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);

    const { plugin, config } = createPlugin({ endpoint: 'https://api.atlasng.dev/t' });
    const page = plugin['page'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;
    const identify = plugin['identify'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;

    page?.({
      ...createArgs(config),
      payload: {
        type: 'page',
        properties: { title: 'Docs' },
        anonymousId: 'session-1',
      },
    } as AnyPluginMethodArgs<TelemetryPluginConfig>);

    identify?.({
      ...createArgs(config),
      payload: {
        type: 'identify',
        traits: { tier: 'pro' },
        anonymousId: 'session-2',
      },
    } as AnyPluginMethodArgs<TelemetryPluginConfig>);

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const first = parseQueryFromUrl(fetchSpy.mock.calls[0][0] as string);
    const second = parseQueryFromUrl(fetchSpy.mock.calls[1][0] as string);

    expect(first['event']).toBe(CoreEvents.PageView);
    expect(first['e']).toEqual({ title: 'Docs' });

    expect(second['event']).toBe(CoreEvents.Identify);
    expect(second['e']).toEqual({ tier: 'pro' });
  });

  it('should send telemetry with HttpClient when enabled', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { plugin, config } = createPlugin({ endpoint: 'https://api.atlasng.dev/t', useHttpClient: true });
    const httpTesting = TestBed.inject(HttpTestingController);
    const track = plugin['track'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;

    track?.({
      ...createArgs(config),
      payload: {
        type: 'track',
        event: CoreEvents.Error,
        properties: { message: 'failed' },
        anonymousId: 'session-http',
      },
    } as AnyPluginMethodArgs<TelemetryPluginConfig>);

    const req = httpTesting.expectOne(
      (request) => request.method === 'GET' && request.url.startsWith('https://api.atlasng.dev/t'),
    );

    expect(req.request.cache).toBe('no-store');
    expect(req.request.keepalive).toBe(true);
    const parsed = parseQueryFromUrl(req.request.urlWithParams);
    expect(parsed['event']).toBe(CoreEvents.Error);
    expect(parsed['sessionId']).toBe('session-http');

    req.flush({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should log fetch transport errors', async () => {
    const error = new Error('network down');
    const fetchSpy = vi.fn().mockRejectedValue(error);
    vi.stubGlobal('fetch', fetchSpy);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { plugin, config } = createPlugin({ endpoint: 'https://api.atlasng.dev/t' });
    const track = plugin['track'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;

    track?.({
      ...createArgs(config),
      payload: {
        type: 'track',
        event: CoreEvents.Error,
        properties: { message: 'boom' },
      },
    } as AnyPluginMethodArgs<TelemetryPluginConfig>);

    await Promise.resolve();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send telemetry data', error);
  });

  it('should log HttpClient transport errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { plugin, config } = createPlugin({ endpoint: 'https://api.atlasng.dev/t', useHttpClient: true });
    const httpTesting = TestBed.inject(HttpTestingController);
    const track = plugin['track'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;

    track?.({
      ...createArgs(config),
      payload: {
        type: 'track',
        event: CoreEvents.Error,
        properties: { message: 'boom' },
      },
    } as AnyPluginMethodArgs<TelemetryPluginConfig>);

    const req = httpTesting.expectOne(
      (request) => request.method === 'GET' && request.url.startsWith('https://api.atlasng.dev/t'),
    );

    req.flush('fail', { status: 500, statusText: 'Internal Server Error' });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0]?.[0]).toBe('Failed to send telemetry data');
  });

  it('should throw for unsupported payload types', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { plugin, config } = createPlugin({ endpoint: 'https://api.atlasng.dev/t' });
    const track = plugin['track'] as ((args: AnyPluginMethodArgs<TelemetryPluginConfig>) => void) | undefined;

    const call = () =>
      track?.({
        ...createArgs(config),
        payload: {
          type: 'trackStart',
          event: CoreEvents.Click,
          properties: {},
        },
      } as unknown as AnyPluginMethodArgs<TelemetryPluginConfig>);

    expect(call).toThrow('Unsupported telemetry payload type: trackStart');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
