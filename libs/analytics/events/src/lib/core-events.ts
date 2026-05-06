import { AnalyticsEventCategory, AnalyticsEventPayload, createAnalyticsEvent } from './event';

/** Payload for an error analytics event. */
export type ErrorAnalyticsEventPayload = AnalyticsEventPayload<{
  message: string;
  context?: unknown;
  reason?: unknown;
}>;

/**
 * Payload for a page view analytics event.
 * Note that page view payloads does not have a trigger or triggerData,
 * and `path` is the url path of the page rather that the scope of the event.
 */
export type PageViewAnalyticsEventPayload = {
  [key: string]: unknown;

  title?: string;
  url?: string;
  path?: string;
  search?: string;
  width?: string;
  height?: string;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CoreEvents {
  export type Blur = typeof CoreEvents.Blur;
  export type Change = typeof CoreEvents.Change;
  export type Click = typeof CoreEvents.Click;
  export type DoubleClick = typeof CoreEvents.DoubleClick;
  export type Error = typeof CoreEvents.Error;
  export type Focus = typeof CoreEvents.Focus;
  export type Hover = typeof CoreEvents.Hover;
  export type Input = typeof CoreEvents.Input;
  export type Keyboard = typeof CoreEvents.Keyboard;
  export type PageView = typeof CoreEvents.PageView;
  export type Reset = typeof CoreEvents.Reset;
  export type Submit = typeof CoreEvents.Submit;
}

/** Predefined common analytics events supported out of the box. */
export const CoreEvents = {
  Blur: createAnalyticsEvent('blur', AnalyticsEventCategory.Statistics),
  Change: createAnalyticsEvent('change', AnalyticsEventCategory.Statistics),
  Click: createAnalyticsEvent('click', AnalyticsEventCategory.Statistics),
  DoubleClick: createAnalyticsEvent('doubleClick', AnalyticsEventCategory.Statistics),
  Error: createAnalyticsEvent<ErrorAnalyticsEventPayload>('error', AnalyticsEventCategory.Necessary),
  Focus: createAnalyticsEvent('focus', AnalyticsEventCategory.Statistics),
  Hover: createAnalyticsEvent('hover', AnalyticsEventCategory.Statistics),
  Input: createAnalyticsEvent('input', AnalyticsEventCategory.Statistics),
  Keyboard: createAnalyticsEvent('keyboard', AnalyticsEventCategory.Statistics),
  PageView: createAnalyticsEvent<PageViewAnalyticsEventPayload>('pageView', AnalyticsEventCategory.Statistics),
  Reset: createAnalyticsEvent('reset', AnalyticsEventCategory.Statistics),
  Submit: createAnalyticsEvent('submit', AnalyticsEventCategory.Statistics),
} as const;
