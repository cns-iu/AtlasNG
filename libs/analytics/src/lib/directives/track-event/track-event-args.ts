import { computed } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import type { AnalyticsEventTrackingDef } from '../track-event';

/** Arguments used to initialize tracking for a single analytics event. */
export type SingleTrackEventArgs<E extends AnalyticsEvent> = [
  event: E | (() => E),
  payload: () => AnalyticsEventPayloadFor<E>,
  options: () => Record<string, unknown> | undefined,
  triggers: () => string[],
  disabled?: () => boolean,
];

/** Arguments used to initialize tracking for multiple analytics events. */
export type MultiTrackEventArgs<E extends AnalyticsEvent> = [
  events: () => AnalyticsEventTrackingDef<E>[],
  disabled?: () => boolean,
];

/** Arguments accepted by the track-event initializer. */
export type TrackEventArgs<E extends AnalyticsEvent> = SingleTrackEventArgs<E> | MultiTrackEventArgs<E>;

/**
 * Determines whether arguments describe a single analytics event.
 *
 * @param args The track-event arguments to inspect.
 * @returns Whether the arguments use the single-event form.
 */
export function isSingleTrackEventArgs<E extends AnalyticsEvent>(
  args: TrackEventArgs<E>,
): args is SingleTrackEventArgs<E> {
  return args.length >= 4;
}

/**
 * Determines whether two sets contain the same values.
 *
 * @param set1 The first set.
 * @param set2 The second set.
 * @returns Whether the sets are equal.
 */
function setEqual(set1: Set<string>, set2: Set<string>): boolean {
  if (set1.size !== set2.size) {
    return false;
  }

  for (const value of set1) {
    if (!set2.has(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a reactive set of the triggers described by track-event arguments.
 *
 * @param args The track-event arguments from which to read triggers.
 * @returns A reactive trigger set.
 */
export function getEventTriggers<E extends AnalyticsEvent>(args: TrackEventArgs<E>): () => Set<string> {
  return computed(
    () => {
      if (isSingleTrackEventArgs(args)) {
        return new Set(args[3]());
      }

      const events = args[0]();
      return new Set(events.map((event) => event.trigger));
    },
    { equal: setEqual },
  );
}
