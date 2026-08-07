import { inject, Service } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor, PageViewAnalyticsEventPayload } from '@atlasng/analytics/events';
import { createConfigurationToken, type } from '@atlasng/core';
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

export const ANALYTICS_CONFIG = createConfigurationToken({
  name: 'ANALYTICS_CONFIG',
  config: type<AnalyticsConfig>(),
  defaults: () => ({}),
});

/**
 * Log analytics events and page views.
 * If no analytics backend is available, the methods of this class are no-ops.
 */
@Service()
export class Analytics {
  /** Analytics configuration. */
  readonly config = ANALYTICS_CONFIG.inject();

  /** Logging backend for handling analytics events. */
  readonly #backend = inject(ANALYTICS_BACKEND, { optional: true });

  /**
   * Track a page view event.
   *
   * @param payload Overrides for the default page view event properties
   * @param options Additional options to pass to the analytics backend
   * @returns A promise that resolves when the page view event has been tracked
   */
  trackPageView(payload?: PageViewAnalyticsEventPayload, options?: Record<string, unknown>): Promise<void> {
    return this.#backend?.page(payload, options) ?? Promise.resolve();
  }

  /**
   * Track an analytics event.
   *
   * @param event Event name
   * @param payload Event payload
   * @param options Additional options to pass to the analytics backend
   * @returns A promise that resolves when the analytics event has been tracked
   */
  trackEvent<E extends AnalyticsEvent>(
    event: E,
    payload: AnalyticsEventPayloadFor<E>,
    options?: Record<string, unknown>,
  ): Promise<void> {
    return this.#backend?.track(event, payload, options) ?? Promise.resolve();
  }
}
