import { numberAttribute } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import type { TrackEventTriggers, TrackEventTriggersInput } from './track-event/initialize-track-event';

/**
 * Normalizes the payload input on specialized tracking directives.
 *
 * @param payload The input payload, which can be an empty string or a valid payload object.
 * @returns An empty object if the input is an empty string, or the original payload otherwise.
 */
export function payloadAttribute<E extends AnalyticsEvent>(
  payload: AnalyticsEventPayloadFor<E> | '',
): AnalyticsEventPayloadFor<E> {
  return payload === '' ? ({} as AnalyticsEventPayloadFor<E>) : payload;
}

/**
 * Normalizes a trigger input into a trigger record.
 *
 * @param triggers A trigger name, an array of trigger names, or a trigger record.
 * @returns The trigger record, with `true` for each named DOM trigger; empty for an empty string.
 */
export function triggersAttribute(triggers: TrackEventTriggersInput): TrackEventTriggers {
  if (typeof triggers === 'string') {
    return triggers === '' ? {} : { [triggers]: true };
  } else if (Array.isArray(triggers)) {
    return Object.fromEntries(triggers.map((trigger) => [trigger, true]));
  }

  return triggers;
}

/**
 * Normalizes a debounce input into a delay in milliseconds.
 *
 * @param delay The delay as a number or a numeric attribute string.
 * @returns The delay, or `undefined` when no delay is set.
 */
export function debounceAttribute(delay: number | string | null | undefined): number | undefined {
  return delay === undefined || delay === null || delay === '' ? undefined : numberAttribute(delay);
}
