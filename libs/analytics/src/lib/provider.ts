import { EnvironmentProviders, ErrorHandler, makeEnvironmentProviders, Provider } from '@angular/core';
import {
  AnalyticsPermissionsManagerConfig,
  provideAnalyticsPermissionsManagerConfig,
} from '@atlasng/analytics/permissions';
import { ANALYTICS_CONFIG, AnalyticsConfig } from './analytics';
import { ANALYTICS_BACKEND, AnalyticsBackend } from './backend';
import { DefaultAnalyticsBackendConfig, defaultBackendFactory } from './default-backend/default-backend';
import { AnalyticsErrorHandler } from './features/error-handler';

/** Represents a feature that can be added to the analytics configuration. */
export interface AnalyticsFeature {
  /** The kind of the analytics feature. */
  kind: AnalyticsFeatureKind;
  /** The providers for the analytics feature. */
  providers: (Provider | EnvironmentProviders)[];
}

/** The different kinds of analytics features that can be added to the configuration. */
export enum AnalyticsFeatureKind {
  /** A custom backend added with {@link withCustomBackend}. */
  CustomBackend,
  /** The default backend added with {@link withDefaultBackend}. */
  DefaultBackend,
  /** Permissions manager configuration added with {@link withPermissionsConfig}. */
  PermissionsManagerConfiguration,
  /** The global error handler added with {@link withGlobalErrorHandler}. */
  GlobalErrorHandler,
}

/**
 * Add a custom analytics backend.
 *
 * Events reach the backend only when the user has granted their consent category.
 *
 * @param backendFactory Factory used to create a custom backend. Runs in an injection context.
 * @returns The custom backend feature.
 */
export function withCustomBackend(backendFactory: () => AnalyticsBackend): AnalyticsFeature {
  return {
    kind: AnalyticsFeatureKind.CustomBackend,
    providers: [
      {
        provide: ANALYTICS_BACKEND,
        useFactory: backendFactory,
      },
    ],
  };
}

/**
 * Add the default analytics backend provided by this library.
 *
 * @param config Endpoint, transport, filtering, and plugin options for the default backend.
 * @returns The default backend feature.
 */
export function withDefaultBackend(config: DefaultAnalyticsBackendConfig): AnalyticsFeature {
  return {
    kind: AnalyticsFeatureKind.DefaultBackend,
    providers: [
      {
        provide: ANALYTICS_BACKEND,
        useFactory: () => defaultBackendFactory(config),
      },
    ],
  };
}

/**
 * Configure the permissions manager.
 *
 * @param config The permissions manager configuration.
 * @returns The permissions manager configuration feature.
 */
export function withPermissionsConfig(config: AnalyticsPermissionsManagerConfig): AnalyticsFeature {
  return {
    kind: AnalyticsFeatureKind.PermissionsManagerConfiguration,
    providers: [provideAnalyticsPermissionsManagerConfig(config)],
  };
}

/**
 * Set up a global `ErrorHandler` to automatically log uncaught errors to analytics.
 * During development it also logs errors to the console to aid debugging.
 *
 * @returns The global error handler feature.
 */
export function withGlobalErrorHandler(): AnalyticsFeature {
  return {
    kind: AnalyticsFeatureKind.GlobalErrorHandler,
    providers: [
      {
        provide: ErrorHandler,
        useExisting: AnalyticsErrorHandler,
      },
    ],
  };
}

/**
 * Configure the analytics system with the given options and features.
 *
 * @param config Analytics configuration options.
 * @param features Additional features to configure the analytics system with.
 * @returns Environment providers for the analytics system.
 */
export function provideAnalytics(config?: AnalyticsConfig, ...features: AnalyticsFeature[]): EnvironmentProviders {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    checkBackendConfiguration(features);
  }

  return makeEnvironmentProviders([
    ANALYTICS_CONFIG.provide(config ?? {}),
    ...features.flatMap((feature) => feature.providers),
  ]);
}

/**
 * Check the provided features for valid backend configuration.
 * Ensures that there is exactly one analytics backend provided, either custom or default, but not both.
 *
 * @param features The features passed to {@link provideAnalytics}.
 * @throws Error when no backend, multiple custom backends, or both a custom and the default backend are provided.
 */
function checkBackendConfiguration(features: AnalyticsFeature[]): void {
  const customBackends = features.filter((feature) => feature.kind === AnalyticsFeatureKind.CustomBackend);
  const hasDefaultBackend = features.some((feature) => feature.kind === AnalyticsFeatureKind.DefaultBackend);

  if (customBackends.length > 1) {
    throw new Error('Multiple custom analytics backends were provided. Please provide only one custom backend.');
  } else if (customBackends.length > 0 && hasDefaultBackend) {
    throw new Error('Cannot provide both a custom analytics backend and the default backend. Please choose one.');
  } else if (customBackends.length === 0 && !hasDefaultBackend) {
    throw new Error(
      'No analytics backend was provided. Please provide a backend using withDefaultBackend() or withCustomBackend().',
    );
  }
}
