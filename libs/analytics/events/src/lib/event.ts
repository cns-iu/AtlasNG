import { GetTagMetadata, Simplify, Tagged } from 'type-fest';

/** Type of an analytics event. */
export type AnalyticsEventType = Tagged<string, 'AnalyticsEventType'>;

/** Category for an analytics event. */
export enum AnalyticsEventCategory {
  Necessary = 'necessary',
  Statistics = 'statistics',
  Preferences = 'preferences',
  Marketing = 'marketing',
}

/** Payload for an analytics event. */
export type AnalyticsEventPayload<T = object> = Simplify<
  T & { [key: string]: unknown; path?: string; trigger?: string; triggerData?: unknown }
>;

/** Analytics event definition. */
export type AnalyticsEvent<P = AnalyticsEventPayload> = Tagged<
  `${AnalyticsEventCategory}:${AnalyticsEventType}`,
  'AnalyticsEvent',
  P
>;

/** Get the payload type for a given analytics event */
export type GetAnalyticsEventPayload<E extends AnalyticsEvent> = GetTagMetadata<E, 'AnalyticsEvent'>;

/**
 * Create a new analytics event.
 *
 * @param type Unique event type
 * @param category Event category
 * @returns New analytics event
 */
export function createAnalyticsEvent<P = AnalyticsEventPayload>(
  type: string,
  category: AnalyticsEventCategory,
): AnalyticsEvent<P> {
  return `${category}:${type}` as AnalyticsEvent<P>;
}

/**
 * Get the category of an analytics event.
 */
export function getAnalyticsEventCategory<E extends AnalyticsEvent>(event: E): AnalyticsEventCategory {
  return event.split(':')[0] as AnalyticsEventCategory;
}

/**
 * Get the type of an analytics event.
 */
export function getAnalyticsEventType<E extends AnalyticsEvent>(event: E): AnalyticsEventType {
  return event.split(':')[1] as AnalyticsEventType;
}
