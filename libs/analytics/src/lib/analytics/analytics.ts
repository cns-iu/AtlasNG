import { inject, Injectable } from '@angular/core';
import { AnalyticsEvent, GetAnalyticsEventPayload, PageViewAnalyticsEventPayload } from '@atlasng/analytics/events';
import { ANALYTICS_BACKEND, AnalyticsBackend } from './backend';

/**
 * Log analytics events and page views.
 * If no analytics backend is available, the methods of this class are no-ops.
 */
@Injectable({
  providedIn: 'root',
})
export class Analytics {
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
    return this.runWithBackend((backend) => backend.page(payload, options));
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
    return this.runWithBackend((backend) => backend.track(event, payload, options));
  }

  /**
   * Run a callback if an analytics backend is available, otherwise do nothing.
   *
   * @param callback Callback to run when the backend is available
   * @returns A promise that resolves with the result of the callback, or void if no backend is available
   */
  private runWithBackend<T>(callback: (backend: AnalyticsBackend) => Promise<T>): Promise<T | void> {
    return this.backend ? callback(this.backend) : Promise.resolve();
  }
}
