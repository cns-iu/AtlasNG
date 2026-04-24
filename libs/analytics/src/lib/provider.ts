import { EnvironmentProviders, ErrorHandler, makeEnvironmentProviders, Provider } from '@angular/core';
import { ANALYTICS_CONFIG, AnalyticsConfig } from './analytics';
import { ANALYTICS_BACKEND, AnalyticsBackend } from './backend';
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
  CustomBackend,
  DefaultBackend,
  GlobalErrorHandler,
}

/**
 * Add a custom analytics backend.
 *
 * @param backendFactory Factory used to create a custom backend.
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
 */
export function withDefaultBackend(/* TODO config */): AnalyticsFeature {
  return {
    kind: AnalyticsFeatureKind.DefaultBackend,
    providers: [
      // TODO
    ],
  };
}

/**
 * Set up a global `ErrorHandler` to automatically log uncaught errors to analytics.
 * During development it also logs errors to the console to aid debugging.
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
 */
export function provideAnalytics(config?: AnalyticsConfig, ...features: AnalyticsFeature[]): EnvironmentProviders {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    checkBackendConfiguration(features);
  }

  return makeEnvironmentProviders([
    {
      provide: ANALYTICS_CONFIG,
      useValue: config ?? {},
    },
    ...features.flatMap((feature) => feature.providers),
  ]);
}

/**
 * Check the provided features for valid backend configuration.
 * Ensures that there is exactly one analytics backend provided, either custom or default, but not both.
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
