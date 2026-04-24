import { inject, Injectable, InjectionToken } from '@angular/core';
import { AnalyticsEvent, GetAnalyticsEventPayload, PageViewAnalyticsEventPayload } from '@atlasng/analytics/events';
import { ANALYTICS_BACKEND } from './backend';

/** Analytics configuration */
export interface AnalyticsConfig {
  /** The name of the application */
  appName?: string;
  /** The version of the application */
  appVersion?: string;
  /** The root scope name for analytics. Defaults to the application name */
  rootScope?: string;
}

/** Injection token for the analytics configuration */
export const ANALYTICS_CONFIG = new InjectionToken<AnalyticsConfig>('ANALYTICS_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * Log analytics events and page views.
 * If no analytics backend is available, the methods of this class are no-ops.
 */
@Injectable({
  providedIn: 'root',
})
export class Analytics {
  /** Analytics configuration. */
  readonly config = inject(ANALYTICS_CONFIG);
  /** Logging backend for handling analytics events. */
  private readonly backend = inject(ANALYTICS_BACKEND, { optional: true });

  /**
   * Log a page view event.
   *
   * @param payload Overrides for the default page view event properties
   * @param options Additional options to pass to the analytics backend
   * @returns A promise that resolves when the page view event has been logged
   */
  logPageView(payload?: PageViewAnalyticsEventPayload, options?: Record<string, unknown>): Promise<void> {
    return this.backend?.page(payload, options) ?? Promise.resolve();
  }

  /**
   * Log an analytics event.
   *
   * @param event Event name
   * @param payload Event payload
   * @param options Additional options to pass to the analytics backend
   * @returns A promise that resolves when the analytics event has been logged
   */
  logEvent<E extends AnalyticsEvent>(
    event: E,
    payload: GetAnalyticsEventPayload<E>,
    options?: Record<string, unknown>,
  ): Promise<void> {
    return this.backend?.track(event, payload, options) ?? Promise.resolve();
  }
}
