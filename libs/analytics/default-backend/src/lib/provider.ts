import { AnalyticsFeature, AnalyticsFeatureKind, ANALYTICS_BACKEND } from '@atlasng/analytics';
import { provideAnalyticsPermissionedStorageKeys } from '@atlasng/analytics/permissions';
import { ANONYMOUS_ID_STORAGE_KEYS } from './anonymous-id';
import { DefaultAnalyticsBackendConfig, defaultBackendFactory } from './default-backend';

/**
 * Add the default analytics backend provided by this library.
 * Requires the `analytics` and `qs` packages.
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
      provideAnalyticsPermissionedStorageKeys(ANONYMOUS_ID_STORAGE_KEYS),
    ],
  };
}
