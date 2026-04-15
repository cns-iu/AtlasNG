import { InjectionToken } from '@angular/core';
import { AnalyticsEvent, GetAnalyticsEventPayload, PageViewAnalyticsEventPayload } from '@atlasng/analytics/events';

/**
 * Analytics backend interface for handling analytics events.
 * Mirrors a subset of the methods provided by the {@link https://getanalytics.io/|analytics} library,
 * but can be implemented by any analytics backend.
 */
export interface AnalyticsBackend {
  /** Log a page view event. */
  page(payload?: PageViewAnalyticsEventPayload, options?: Record<string, unknown>): Promise<void>;
  /** Log an analytics event. */
  track<E extends AnalyticsEvent>(
    event: E,
    payload: GetAnalyticsEventPayload<E>,
    options?: Record<string, unknown>,
  ): Promise<void>;
}

/**
 * Injection token for the analytics backend.
 */
export const ANALYTICS_BACKEND = new InjectionToken<AnalyticsBackend>('ANALYTICS_BACKEND');


