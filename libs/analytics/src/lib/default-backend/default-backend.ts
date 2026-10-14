import { isPlatformBrowser } from '@angular/common';
import { effect, inject, PLATFORM_ID } from '@angular/core';
import { AnalyticsEventCategory } from '@atlasng/analytics/events';
import { AnalyticsPermissionsManager } from '@atlasng/analytics/permissions';
import { SESSION_STORAGE } from '@atlasng/core';
import { Analytics, AnalyticsPlugin } from 'analytics';
import { ANALYTICS_CONFIG } from '../analytics';
import { AnalyticsBackend } from '../backend';
import { ConsentStorage, createConsentStorage } from './consent-storage';
import { ATLASNG_CALL_OPTION, eventFilterPlugin, EventFilterPluginConfig } from './event-filter-plugin';
import { telemetryPlugin, TelemetryPluginConfig } from './telemetry-plugin';

/**
 * Options passed to the underlying analytics instance.
 * Extends the package's typed options with the untyped `storage` option it supports.
 */
type AnalyticsFactoryConfig = Parameters<typeof Analytics>[0] & {
  /** Storage adapter used for the anonymous ID, user ID, and traits. */
  storage: ConsentStorage;
};

/** Factory signature used to create the underlying analytics instance. */
type AnalyticsFactory = (config: AnalyticsFactoryConfig) => AnalyticsBackend;

/**
 * Configuration for the default analytics backend factory.
 *
 * Combines telemetry transport settings, event filtering settings,
 * and optional additional analytics plugins.
 */
export interface DefaultAnalyticsBackendConfig extends EventFilterPluginConfig, TelemetryPluginConfig {
  /**
   * Additional plugins to append after built-in AtlasNG plugins.
   *
   * Can be provided eagerly as an array or lazily via a factory function.
   */
  plugins?: AnalyticsPlugin[] | (() => AnalyticsPlugin[]);
}

/**
 * Creates the default AtlasNG analytics backend instance.
 *
 * The resulting backend includes built-in event filtering and telemetry
 * plugins, plus any caller-provided plugins. The anonymous ID is kept in
 * memory until the user grants the `statistics` category and in
 * `sessionStorage` afterwards; see {@link createConsentStorage}.
 *
 * @param config Combined backend configuration.
 * @param analyticsFactory Factory used to create the underlying analytics instance.
 * @returns Configured analytics backend instance.
 */
export function defaultBackendFactory(
  config: DefaultAnalyticsBackendConfig,
  analyticsFactory: AnalyticsFactory = Analytics,
): AnalyticsBackend {
  const { appName, appVersion } = ANALYTICS_CONFIG.inject();
  const plugins = typeof config.plugins === 'function' ? config.plugins() : (config.plugins ?? []);
  const storage = injectConsentStorage();
  const instance = analyticsFactory({
    app: appName,
    version: appVersion,
    debug: !!(typeof ngDevMode === 'undefined' || ngDevMode),
    plugins: [eventFilterPlugin(config), telemetryPlugin(config), ...plugins],
    storage,
  });

  // Mark calls made through this backend so the event filter can drop calls
  // the `analytics` package issues on its own (for example from `an_uid` or `an_event` URL parameters).
  return {
    page: (payload, options) => instance.page(payload, { ...options, [ATLASNG_CALL_OPTION]: true }),
    track: (event, payload, options) => instance.track(event, payload, { ...options, [ATLASNG_CALL_OPTION]: true }),
  };
}

/**
 * Creates the consent-aware storage for the analytics instance and keeps it in
 * sync with the `statistics` consent category.
 *
 * @returns Storage adapter for the analytics instance
 */
function injectConsentStorage(): ConsentStorage {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const sessionStorage = isBrowser ? inject(SESSION_STORAGE) : undefined;
  const permissions = inject(AnalyticsPermissionsManager).permissions;
  const storage = createConsentStorage(sessionStorage, () =>
    permissions().isCategoryEnabled(AnalyticsEventCategory.Statistics),
  );

  effect(() => storage.sync());
  return storage;
}
