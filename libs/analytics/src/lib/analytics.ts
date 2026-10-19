import { inject, Service } from '@angular/core';
import {
  AnalyticsEvent,
  AnalyticsEventPayloadFor,
  CoreEvents,
  PageViewAnalyticsEventPayload,
} from '@atlasng/analytics/events';
import { AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { createConfigurationToken, type } from '@atlasng/core';
import { ANALYTICS_BACKEND, AnalyticsBackend } from './backend';

/** Analytics configuration */
export interface AnalyticsConfig {
  /** The name of the application */
  appName?: string;
  /** The version of the application */
  appVersion?: string;
  /** The root scope name for analytics. Defaults to the application name */
  rootScope?: string;
}

/**
 * Configuration token for {@link AnalyticsConfig}.
 * Provided by {@link provideAnalytics}; defaults to an empty configuration.
 */
export const ANALYTICS_CONFIG = createConfigurationToken({
  name: 'ANALYTICS_CONFIG',
  config: type<AnalyticsConfig>(),
  defaults: () => ({}),
});

/**
 * Log analytics events and page views.
 * If no analytics backend is available, the methods of this class are no-ops.
 *
 * Events are only forwarded to the backend when the user has granted the
 * event's consent category in {@link AnalyticsPermissionsManager}. This applies
 * to every backend, including those registered with `withCustomBackend()`.
 */
@Service()
export class Analytics {
  /** Analytics configuration. */
  readonly config = ANALYTICS_CONFIG.inject();

  /** Logging backend, or `null` when none is provided. */
  readonly #backend = inject(ANALYTICS_BACKEND, { optional: true });

  /** Consent permissions that gate the backend. */
  readonly #permissionsManager = inject(AnalyticsPermissionsManager);

  /**
   * Track a page view event.
   *
   * @param payload Overrides for the default page view event properties
   * @param options Additional options to pass to the analytics backend
   * @returns A promise that resolves when the page view event has been tracked
   */
  trackPageView(payload?: PageViewAnalyticsEventPayload, options?: Record<string, unknown>): Promise<void> {
    return this.#run(CoreEvents.PageView, (backend) => backend.page(payload, options));
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
    return this.#run(event, (backend) => backend.track(event, payload, options));
  }

  /**
   * Runs an operation against the backend when the user has granted consent for the event's category.
   *
   * @param event Event whose consent category gates the operation
   * @param operation Operation to run
   * @returns The operation's promise, or a resolved promise when there is no backend or consent is missing
   */
  #run(event: AnalyticsEvent, operation: (backend: AnalyticsBackend) => Promise<void>): Promise<void> {
    const backend = this.#backend;
    if (!backend || !this.#permissionsManager.permissions().isEventEnabled(event)) {
      return Promise.resolve();
    }

    return operation(backend);
  }
}
