import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { AnalyticsPlugin } from 'analytics';
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
 * Builds an analytics plugin that blocks events when runtime constraints
 * or permissions disallow tracking.
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
    } else if (!permissions().isEventEnabled(event)) {
      return abort(`Event "${event}" is disabled by permissions`);
    }
  };

  return {
    name: 'atlasng-event-filter',
    config,
    pageStart: (args: PageMethodArgs<EventFilterPluginConfig>) => handleEvent(CoreEvents.PageView, args),
    identifyStart: (args: IdentifyMethodArgs<EventFilterPluginConfig>) => handleEvent(CoreEvents.Identify, args),
    trackStart: (args: TrackMethodArgs<EventFilterPluginConfig>) => handleEvent(args.payload.event, args),
  };
}
