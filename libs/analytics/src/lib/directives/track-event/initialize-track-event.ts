import { assertInInjectionContext, DestroyRef, effect, inject } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import type { AnalyticsEventTrackingDef } from '../track-event';
import { getEventTriggers, isSingleTrackEventArgs, TrackEventArgs } from './track-event-args';
import { TrackEventHandler } from './track-event-handler';
import { TrackEventListenerManager } from './track-event-listener-manager';

/**
 * Initializes tracking for a single analytics event.
 *
 * @param event The analytics event or reactive event source.
 * @param payload The reactive event payload.
 * @param options The reactive analytics options.
 * @param triggers The reactive DOM trigger names.
 * @param disabled Whether tracking is disabled.
 */
export function initializeTrackEvent<E extends AnalyticsEvent>(
  event: E | (() => E),
  payload: () => AnalyticsEventPayloadFor<E>,
  options: () => Record<string, unknown> | undefined,
  triggers: () => string[],
  disabled?: () => boolean,
): void;
/**
 * Initializes tracking for multiple analytics events.
 *
 * @param events The reactive event definitions.
 * @param disabled Whether tracking is disabled.
 */
export function initializeTrackEvent<E extends AnalyticsEvent>(
  events: () => AnalyticsEventTrackingDef<E>[],
  disabled?: () => boolean,
): void;
export function initializeTrackEvent<E extends AnalyticsEvent>(...args: TrackEventArgs<E>): void {
  assertInInjectionContext(initializeTrackEvent);

  const handler = new TrackEventHandler(args);
  const manager = new TrackEventListenerManager(handler);
  const triggers = getEventTriggers(args);
  const disabled = isSingleTrackEventArgs(args) ? args[4] : args[1];

  effect(() => {
    if (disabled?.()) {
      manager.removeListeners();
    } else {
      manager.updateListeners(triggers());
    }
  });

  inject(DestroyRef).onDestroy(() => manager.destroy());
}
