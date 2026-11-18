import { assertInInjectionContext, inject, Injector } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import { Analytics } from './analytics';
import { EVENT_SCOPE } from './scope';

/**
 * Tracks an analytics event under the event scope captured by {@link injectTrackEvent}.
 *
 * @param event The analytics event to track
 * @param payload The event payload; its `path` is replaced with the scope path
 * @param options Additional options to pass to the analytics backend
 */
export type TrackEventFn = <E extends AnalyticsEvent>(
  event: E,
  payload: AnalyticsEventPayloadFor<E>,
  options?: Record<string, unknown>,
) => void;

/**
 * Creates a function that tracks analytics events under the current event scope.
 *
 * Use it for interactions that do not surface as DOM events on an element, such as
 * Angular Material `selectionChange` outputs, where the `angTrack*` directives cannot listen.
 * Pass plain, serializable data in the payload rather than component or event objects.
 *
 * @returns A function that tracks events with the current scope path
 */
export function injectTrackEvent(options?: { injector?: Injector }): TrackEventFn {
  if (!options?.injector) {
    assertInInjectionContext(injectTrackEvent);
  }

  const injector = options?.injector ?? inject(Injector);
  const analytics = injector.get(Analytics);
  const scope = injector.get(EVENT_SCOPE);

  return (event, payload, opts) => {
    void analytics.trackEvent(event, { ...payload, path: scope.path() }, opts);
  };
}
