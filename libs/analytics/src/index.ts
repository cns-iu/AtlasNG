export { Analytics, ANALYTICS_CONFIG, type AnalyticsConfig } from './lib/analytics';
export { ANALYTICS_BACKEND, type AnalyticsBackend } from './lib/backend';
export { type DefaultAnalyticsBackendConfig } from './lib/default-backend/default-backend';
export { type EventFilterPluginConfig } from './lib/default-backend/event-filter-plugin';
export { type TelemetryPluginConfig } from './lib/default-backend/telemetry-plugin';
export {
  TrackBlur,
  TrackChange,
  TrackClick,
  TrackDoubleClick,
  TrackError,
  TrackFocus,
  TrackHover,
  TrackInput,
  TrackKeyboard,
  TrackReset,
  TrackSubmit,
} from './lib/directives/core-track-events';
export { MultiTrackEvent, TrackEvent, type AnalyticsEventTrackingDef } from './lib/directives/track-event';
export { payloadAttribute, triggersAttribute } from './lib/directives/track-event-transforms';
export { initializeTrackEvent } from './lib/directives/track-event/initialize-track-event';
export {
  AnalyticsFeatureKind,
  provideAnalytics,
  withCustomBackend,
  withDefaultBackend,
  withGlobalErrorHandler,
  withPermissionsConfig,
  type AnalyticsFeature,
} from './lib/provider';
export { EVENT_SCOPE, EventScope, provideEventScope, type IEventScope } from './lib/scope';
