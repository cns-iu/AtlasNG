import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { AnalyticsInstance, AnalyticsPlugin } from 'analytics';
import { AbortResult, AnyPluginMethodArgs, IdentifyMethodArgs, PageMethodArgs, TrackMethodArgs } from './types';

/**
 * Configuration for the event filter plugin.
 */
export interface EventFilterPluginConfig {
  /**
   * Whether tracking is allowed when executing on the server.
   *
   * Defaults to disabled unless explicitly enabled.
   */
  enableServerSideTracking?: boolean;
}

/**
 * Custom methods the default backend's event filter plugin adds to the analytics instance.
 * Get them with {@link getDefaultBackendEventFilterMethods}.
 */
export interface DefaultBackendEventFilterMethods {
  /**
   * Creates call options that the event filter treats as safe and lets through.
   * Calls without these options, such as those the `analytics` package makes for URL parameters, are dropped.
   *
   * Safe calls are still subject to consent: they are dropped unless the user has granted the event's category.
   *
   * @param options Options to pass to `page` or `track`.
   * @returns A copy of the options with the call marker added.
   */
  createSafeOptions(options?: Record<string, unknown>): Record<string, unknown>;
}

/**
 * Name under which the event filter plugin and its methods are registered.
 */
const EVENT_FILTER_PLUGIN_NAME = 'atlasng-event-filter';

/**
 * Option set on every call the default backend makes, so the event filter can
 * tell those calls apart from calls the `analytics` package issues on its own.
 * Set it through {@link DefaultBackendEventFilterMethods.createSafeOptions}.
 */
const ATLASNG_CALL_OPTION = '__atlasng__';

/**
 * Builds an analytics plugin that blocks events when runtime constraints
 * or permissions disallow tracking.
 *
 * It also blocks calls that weren't made through the default backend. The
 * `analytics` package parses `an_uid`, `an_trait_*`, `an_event`, and `an_prop_*`
 * URL parameters on startup and calls `identify`/`track` with them; those calls
 * are dropped here so a crafted link can't send events.
 *
 * @param config Event filter configuration.
 * @returns Analytics plugin implementation.
 * @throws Error when the backend does not expose an abort API.
 */
export function eventFilterPlugin(config: EventFilterPluginConfig): AnalyticsPlugin {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const permissions = inject(AnalyticsPermissionsManager).permissions;
  /**
   * Checks whether an event should be allowed to proceed.
   *
   * @param event Event identifier being emitted.
   * @param args Plugin invocation arguments for the current event.
   * @returns Abort token when blocked, otherwise void.
   */
  const handleEvent = (
    event: AnalyticsEvent,
    args: AnyPluginMethodArgs<EventFilterPluginConfig>,
  ): AbortResult | void => {
    const isEnabled = isBrowser || args.config.enableServerSideTracking;
    const { abort } = args;
    if (!abort) {
      throw new Error('EventFilterPlugin requires analytics backend to support aborting events');
    } else if (!isEnabled) {
      return abort('Event tracking is disabled on the server');
    } else if (args.payload.options?.[ATLASNG_CALL_OPTION] !== true) {
      return abort(`Event "${event}" was not sent through the AtlasNG analytics backend`);
    } else if (!permissions().isEventEnabled(event)) {
      // `Analytics` checks consent too, but plugins can call the instance directly with safe options
      return abort(`Event "${event}" is disabled by permissions`);
    }
  };

  const methods: DefaultBackendEventFilterMethods = {
    createSafeOptions: (options) => ({ ...options, [ATLASNG_CALL_OPTION]: true }),
  };

  return {
    name: EVENT_FILTER_PLUGIN_NAME,
    config,
    methods,
    pageStart: (args: PageMethodArgs<EventFilterPluginConfig>) => handleEvent(CoreEvents.PageView, args),
    identifyStart: (args: IdentifyMethodArgs<EventFilterPluginConfig>) => handleEvent(CoreEvents.Identify, args),
    trackStart: (args: TrackMethodArgs<EventFilterPluginConfig>) => handleEvent(args.payload.event, args),
  };
}

/**
 * Returns the event filter methods registered on an analytics instance of the default backend,
 * for example from a custom plugin's `instance` argument.
 *
 * @param instance Analytics instance created by the default backend.
 * @returns The event filter plugin methods.
 * @throws Error when the event filter plugin is not registered on the instance.
 */
export function getDefaultBackendEventFilterMethods(
  instance: Pick<AnalyticsInstance, 'plugins'>,
): DefaultBackendEventFilterMethods {
  const plugins = instance.plugins as unknown as Partial<Record<string, DefaultBackendEventFilterMethods>>;
  const methods = plugins[EVENT_FILTER_PLUGIN_NAME];
  if (!methods) {
    throw new Error(
      'The analytics instance is missing the event filter plugin; was it created by the default backend (withDefaultBackend())?',
    );
  }

  return methods;
}
