import { AnalyticsEventCategory, AnalyticsEventPayload, createAnalyticsEvent } from './event';

/** Payload for an error analytics event */
export type ErrorAnalyticsEventPayload = AnalyticsEventPayload<{
  message: string;
  context?: unknown;
  reason?: unknown;
}>;

/** Payload for a page view analytics event */
export type PageViewAnalyticsEventPayload = AnalyticsEventPayload<{
  title: string;
  url: string;
  path: string;
  hash: string;
  search: string;
  width: number;
  height: number;
  referrer?: string;
}>;

/** Predefined common analytics events supported out of the box */
export const CoreEvents = {
  Click: createAnalyticsEvent('click', AnalyticsEventCategory.Statistics),
  DoubleClick: createAnalyticsEvent('doubleClick', AnalyticsEventCategory.Statistics),
  Error: createAnalyticsEvent<ErrorAnalyticsEventPayload>('error', AnalyticsEventCategory.Necessary),
  Hover: createAnalyticsEvent('hover', AnalyticsEventCategory.Statistics),
  Keyboard: createAnalyticsEvent('keyboard', AnalyticsEventCategory.Statistics),
  PageView: createAnalyticsEvent<PageViewAnalyticsEventPayload>('pageView', AnalyticsEventCategory.Statistics),
} as const;
