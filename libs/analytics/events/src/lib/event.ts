import { GetTagMetadata, Simplify, Tagged } from 'type-fest';

/** Type of an analytics event. */
export type AnalyticsEventType = Tagged<string, 'AnalyticsEventType'>;

/** Category for an analytics event. */
export enum AnalyticsEventCategory {
  /** Events required for the application to work, such as errors. Always enabled. */
  Necessary = 'necessary',
  /** Events that measure how the application is used. */
  Statistics = 'statistics',
  /** Events related to remembering user preferences. */
  Preferences = 'preferences',
  /** Events used for marketing or by third-party content. */
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
export type AnalyticsEventPayloadFor<E extends AnalyticsEvent> = GetTagMetadata<E, 'AnalyticsEvent'>;

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
 *
 * @param event The analytics event
 * @returns The event's category
 */
export function getAnalyticsEventCategory<E extends AnalyticsEvent>(event: E): AnalyticsEventCategory {
  return event.split(':')[0] as AnalyticsEventCategory;
}

/**
 * Get the type of an analytics event.
 *
 * @param event The analytics event
 * @returns The event's type
 */
export function getAnalyticsEventType<E extends AnalyticsEvent>(event: E): AnalyticsEventType {
  return event.split(':')[1] as AnalyticsEventType;
}
