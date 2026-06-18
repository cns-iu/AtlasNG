import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPermissions, AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { eventFilterPlugin, EventFilterPluginConfig } from './event-filter-plugin';
import { AnyPluginMethodArgs, TrackMethodArgs } from './types';

describe('eventFilterPlugin', () => {
  function createPlugin(options?: {
    platformId?: unknown;
    permissions?: AnalyticsPermissions;
    config?: EventFilterPluginConfig;
  }) {
    const permissions = options?.permissions ?? AnalyticsPermissions.DEFAULT;
    const platformId = options?.platformId ?? 'browser';
    const config = options?.config ?? {};

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        {
          provide: AnalyticsPermissionsManager,
          useValue: {
            permissions: () => permissions,
          },
        },
      ],
    });

    const plugin = TestBed.runInInjectionContext(() => eventFilterPlugin(config));
    return { plugin, config };
  }

  function createBaseArgs(config: EventFilterPluginConfig, abort?: (reason: string) => unknown) {
    return {
      config,
      abort,
      instance: {} as never,
      plugins: {},
    };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('should expose plugin name and config', () => {
    const config = { enableServerSideTracking: true };
    const { plugin } = createPlugin({ config });

    expect(plugin.name).toBe('atlasng-event-filter');
    expect(plugin.config).toBe(config);
  });

  it('should throw when abort callback is missing', () => {
    const { plugin, config } = createPlugin();
    const trackStart = plugin['trackStart'] as ((args: TrackMethodArgs<EventFilterPluginConfig>) => unknown) | undefined;
    const args = {
      ...createBaseArgs(config),
      payload: {
        type: 'trackStart',
        event: CoreEvents.Error,
        properties: {},
      },
    } as TrackMethodArgs<EventFilterPluginConfig>;

    expect(() => trackStart?.(args)).toThrow(
      'EventFilterPlugin requires analytics backend to support aborting events',
    );
  });

  it('should abort when tracking is disabled on the server', () => {
    const { plugin, config } = createPlugin({ platformId: 'server' });
    const trackStart = plugin['trackStart'] as ((args: TrackMethodArgs<EventFilterPluginConfig>) => unknown) | undefined;
    const aborted = Symbol('aborted');
    const abort = vi.fn().mockReturnValue(aborted);

    const args = {
      ...createBaseArgs(config, abort),
      payload: {
        type: 'trackStart',
        event: CoreEvents.Error,
        properties: {},
      },
    } as TrackMethodArgs<EventFilterPluginConfig>;

    const result = trackStart?.(args);

    expect(abort).toHaveBeenCalledWith('Event tracking is disabled on the server');
    expect(result).toBe(aborted);
  });

  it('should allow tracking on the server when explicitly enabled', () => {
    const config = { enableServerSideTracking: true };
    const { plugin } = createPlugin({ platformId: 'server', config });
    const trackStart = plugin['trackStart'] as ((args: TrackMethodArgs<EventFilterPluginConfig>) => unknown) | undefined;
    const abort = vi.fn();

    const args = {
      ...createBaseArgs(config, abort),
      payload: {
        type: 'trackStart',
        event: CoreEvents.Error,
        properties: {},
      },
    } as TrackMethodArgs<EventFilterPluginConfig>;

    const result = trackStart?.(args);

    expect(abort).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should abort page events when permissions disable the category', () => {
    const { plugin, config } = createPlugin({ permissions: AnalyticsPermissions.DEFAULT });
    const pageStart = plugin['pageStart'] as ((args: AnyPluginMethodArgs<EventFilterPluginConfig>) => unknown) | undefined;
    const aborted = Symbol('aborted');
    const abort = vi.fn().mockReturnValue(aborted);

    const args = {
      ...createBaseArgs(config, abort),
      payload: {
        type: 'pageStart',
        properties: {},
      },
    } as AnyPluginMethodArgs<EventFilterPluginConfig>;

    const result = pageStart?.(args);

    expect(abort).toHaveBeenCalledWith(`Event "${CoreEvents.PageView}" is disabled by permissions`);
    expect(result).toBe(aborted);
  });

  it('should abort identify events when permissions disable the category', () => {
    const { plugin, config } = createPlugin({ permissions: AnalyticsPermissions.DEFAULT });
    const identifyStart = plugin['identifyStart'] as
      | ((args: AnyPluginMethodArgs<EventFilterPluginConfig>) => unknown)
      | undefined;
    const aborted = Symbol('aborted');
    const abort = vi.fn().mockReturnValue(aborted);

    const args = {
      ...createBaseArgs(config, abort),
      payload: {
        type: 'identifyStart',
        traits: {},
      },
    } as AnyPluginMethodArgs<EventFilterPluginConfig>;

    const result = identifyStart?.(args);

    expect(abort).toHaveBeenCalledWith(`Event "${CoreEvents.Identify}" is disabled by permissions`);
    expect(result).toBe(aborted);
  });

  it('should allow track events when permissions enable the category', () => {
    const { plugin, config } = createPlugin({ permissions: AnalyticsPermissions.FULL });
    const trackStart = plugin['trackStart'] as ((args: TrackMethodArgs<EventFilterPluginConfig>) => unknown) | undefined;
    const abort = vi.fn();

    const args = {
      ...createBaseArgs(config, abort),
      payload: {
        type: 'trackStart',
        event: CoreEvents.Identify,
        properties: {},
      },
    } as TrackMethodArgs<EventFilterPluginConfig>;

    const result = trackStart?.(args);

    expect(abort).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
