import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';

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
 * Normalizes a trigger input into an array of trigger names.
 *
 * @param triggers A single trigger name or an array of trigger names.
 * @returns An empty array for an empty string, the original array, or an array containing the single trigger name.
 */
export function triggersAttribute(triggers: string | string[]): string[] {
  return triggers === '' ? [] : Array.isArray(triggers) ? triggers : [triggers];
}
