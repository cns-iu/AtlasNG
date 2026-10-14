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

/** Types of the predefined {@link CoreEvents} values. */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CoreEvents {
  /** Type of {@link CoreEvents.Blur}. */
  export type Blur = typeof CoreEvents.Blur;
  /** Type of {@link CoreEvents.Change}. */
  export type Change = typeof CoreEvents.Change;
  /** Type of {@link CoreEvents.Click}. */
  export type Click = typeof CoreEvents.Click;
  /** Type of {@link CoreEvents.DoubleClick}. */
  export type DoubleClick = typeof CoreEvents.DoubleClick;
  /** Type of {@link CoreEvents.Error}. */
  export type Error = typeof CoreEvents.Error;
  /** Type of {@link CoreEvents.Focus}. */
  export type Focus = typeof CoreEvents.Focus;
  /** Type of {@link CoreEvents.Hover}. */
  export type Hover = typeof CoreEvents.Hover;
  /** Type of {@link CoreEvents.Identify}. */
  export type Identify = typeof CoreEvents.Identify;
  /** Type of {@link CoreEvents.Input}. */
  export type Input = typeof CoreEvents.Input;
  /** Type of {@link CoreEvents.Keyboard}. */
  export type Keyboard = typeof CoreEvents.Keyboard;
  /** Type of {@link CoreEvents.PageView}. */
  export type PageView = typeof CoreEvents.PageView;
  /** Type of {@link CoreEvents.Reset}. */
  export type Reset = typeof CoreEvents.Reset;
  /** Type of {@link CoreEvents.Submit}. */
  export type Submit = typeof CoreEvents.Submit;
}

/** Predefined common analytics events supported out of the box. */
export const CoreEvents = {
  /** An element lost focus. */
  Blur: createAnalyticsEvent('blur', AnalyticsEventCategory.Statistics),
  /** A form control value was committed. */
  Change: createAnalyticsEvent('change', AnalyticsEventCategory.Statistics),
  /** An element was clicked. */
  Click: createAnalyticsEvent('click', AnalyticsEventCategory.Statistics),
  /** An element was double-clicked. */
  DoubleClick: createAnalyticsEvent('doubleClick', AnalyticsEventCategory.Statistics),
  /** An error occurred. Necessary, so it is sent without consent. */
  Error: createAnalyticsEvent<ErrorAnalyticsEventPayload>('error', AnalyticsEventCategory.Necessary),
  /** An element received focus. */
  Focus: createAnalyticsEvent('focus', AnalyticsEventCategory.Statistics),
  /** The pointer moved over an element. */
  Hover: createAnalyticsEvent('hover', AnalyticsEventCategory.Statistics),
  /** A user was identified. Marketing category. */
  Identify: createAnalyticsEvent('identify', AnalyticsEventCategory.Marketing),
  /** A form control value changed while editing. */
  Input: createAnalyticsEvent('input', AnalyticsEventCategory.Statistics),
  /** A key was pressed. */
  Keyboard: createAnalyticsEvent('keyboard', AnalyticsEventCategory.Statistics),
  /** A page was viewed. */
  PageView: createAnalyticsEvent<PageViewAnalyticsEventPayload>('pageView', AnalyticsEventCategory.Statistics),
  /** A form was reset. */
  Reset: createAnalyticsEvent('reset', AnalyticsEventCategory.Statistics),
  /** A form was submitted. */
  Submit: createAnalyticsEvent('submit', AnalyticsEventCategory.Statistics),
} as const;
