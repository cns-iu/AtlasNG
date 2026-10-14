import { inject, Service, Signal } from '@angular/core';
import {
  AnalyticsEvent,
  AnalyticsEventPayloadFor,
  CoreEvents,
  PageViewAnalyticsEventPayload,
} from '@atlasng/analytics/events';
import { AnalyticsPermissions, AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
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

/** Analytics backend paired with the consent permissions that gate it. */
interface AnalyticsTarget {
  /** Backend that receives permitted events. */
  backend: AnalyticsBackend;
  /** Current consent permissions. */
  permissions: Signal<AnalyticsPermissions>;
}

/**
 * Resolves the backend and, when one exists, the consent permissions signal.
 *
 * @returns The backend and permissions, or `undefined` when no backend is provided
 */
function injectAnalyticsTarget(): AnalyticsTarget | undefined {
  const backend = inject(ANALYTICS_BACKEND, { optional: true });
  return backend ? { backend, permissions: inject(AnalyticsPermissionsManager).permissions } : undefined;
}

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

  /**
   * Logging backend paired with the consent permissions that gate it.
   * The permissions manager is only injected when a backend exists, so the
   * no-op service has no browser dependencies.
   */
  readonly #target = injectAnalyticsTarget();

  /**
   * Track a page view event.
   *
   * @param payload Overrides for the default page view event properties
   * @param options Additional options to pass to the analytics backend
   * @returns A promise that resolves when the page view event has been tracked
   */
  trackPageView(payload?: PageViewAnalyticsEventPayload, options?: Record<string, unknown>): Promise<void> {
    return this.#backendFor(CoreEvents.PageView)?.page(payload, options) ?? Promise.resolve();
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
    return this.#backendFor(event)?.track(event, payload, options) ?? Promise.resolve();
  }

  /**
   * Returns the backend when the user has granted consent for the event's category.
   *
   * @param event Event to check
   * @returns The backend, or `undefined` when there is no backend or consent is missing
   */
  #backendFor(event: AnalyticsEvent): AnalyticsBackend | undefined {
    const target = this.#target;
    return target?.permissions().isEventEnabled(event) ? target.backend : undefined;
  }
}
