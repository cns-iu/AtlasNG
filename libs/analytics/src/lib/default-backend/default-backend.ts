import { inject } from '@angular/core';
import { AnalyticsPermissionedStorage } from '@atlasng/analytics/permissions';
import { Analytics, AnalyticsInstance, AnalyticsPlugin } from 'analytics';
import { ANALYTICS_CONFIG } from '../analytics';
import { AnalyticsBackend } from '../backend';
import { eventFilterPlugin, EventFilterPluginConfig, getDefaultBackendEventFilterMethods } from './event-filter-plugin';
import { telemetryPlugin, TelemetryPluginConfig } from './telemetry-plugin';

/**
 * Options passed to the underlying analytics instance.
 * Extends the package's typed options with the untyped `storage` option it supports.
 */
type AnalyticsFactoryConfig = Parameters<typeof Analytics>[0] & {
  /** Storage adapter used for the anonymous ID, user ID, and traits. */
  storage: AnalyticsPermissionedStorage;
};

/** Factory signature used to create the underlying analytics instance. */
type AnalyticsFactory = (config: AnalyticsFactoryConfig) => AnalyticsBackend & Pick<AnalyticsInstance, 'plugins'>;

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
 * `localStorage` afterwards; see {@link AnalyticsPermissionedStorage}.
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
  const storage = inject(AnalyticsPermissionedStorage);
  const instance = analyticsFactory({
    app: appName,
    version: appVersion,
    debug: !!(typeof ngDevMode === 'undefined' || ngDevMode),
    plugins: [eventFilterPlugin(config), telemetryPlugin(config), ...plugins],
    storage,
  });

  // Mark calls made through this backend so the event filter can drop calls
  // the `analytics` package issues on its own (for example from `an_uid` or `an_event` URL parameters).
  const { createSafeOptions } = getDefaultBackendEventFilterMethods(instance);
  return {
    page: (payload, options) => instance.page(payload, createSafeOptions(options)),
    track: (event, payload, options) => instance.track(event, payload, createSafeOptions(options)),
  };
}
