import { InjectionToken } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor, PageViewAnalyticsEventPayload } from '@atlasng/analytics/events';

/**
 * Analytics backend interface for handling analytics events.
 */
export interface AnalyticsBackend {
  /**
   * Log a page view event.
   *
   * @param payload Overrides for the default page view properties
   * @param options Backend-specific options
   * @returns A promise that resolves when the page view has been handled
   */
  page(payload?: PageViewAnalyticsEventPayload, options?: Record<string, unknown>): Promise<void>;
  /**
   * Log an analytics event.
   *
   * @param event The event to log
   * @param payload The event payload
   * @param options Backend-specific options
   * @returns A promise that resolves when the event has been handled
   */
  track<E extends AnalyticsEvent>(
    event: E,
    payload: AnalyticsEventPayloadFor<E>,
    options?: Record<string, unknown>,
  ): Promise<void>;
}

/**
 * Injection token for the analytics backend.
 */
export const ANALYTICS_BACKEND = new InjectionToken<AnalyticsBackend>('ANALYTICS_BACKEND');
