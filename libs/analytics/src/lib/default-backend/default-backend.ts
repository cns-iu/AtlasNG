import { Analytics, AnalyticsPlugin } from 'analytics';
import { ANALYTICS_CONFIG } from '../analytics';
import { AnalyticsBackend } from '../backend';
import { eventFilterPlugin, EventFilterPluginConfig } from './event-filter-plugin';
import { telemetryPlugin, TelemetryPluginConfig } from './telemetry-plugin';

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
 * plugins, plus any caller-provided plugins.
 *
 * @param config Combined backend configuration.
 * @returns Configured analytics backend instance.
 */
export function defaultBackendFactory(config: DefaultAnalyticsBackendConfig): AnalyticsBackend {
  const { appName, appVersion } = ANALYTICS_CONFIG.inject();
  const plugins = typeof config.plugins === 'function' ? config.plugins() : (config.plugins ?? []);

  return Analytics({
    app: appName,
    version: appVersion,
    debug: !!(typeof ngDevMode === 'undefined' || ngDevMode),
    plugins: [eventFilterPlugin(config), telemetryPlugin(config), ...plugins],
  });
}
