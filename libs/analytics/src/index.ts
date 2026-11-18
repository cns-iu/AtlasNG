export { AnalyticsErrorCode } from '@atlasng/analytics/errors';
export { Analytics, ANALYTICS_CONFIG, type AnalyticsConfig } from './lib/analytics';
export { ANALYTICS_BACKEND, type AnalyticsBackend } from './lib/backend';
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
export {
  initializeTrackEvent,
  type MultiTrackEventConfig,
  type TrackEventConfig,
  type TrackEventSource,
  type TrackEventTriggers,
  type TrackEventTriggersInput,
} from './lib/directives/track-event/initialize-track-event';
export {
  debounceAttribute,
  payloadAttribute,
  triggersAttribute,
} from './lib/directives/track-event/track-event-transforms';
export { injectTrackEvent, type TrackEventFn } from './lib/inject-track-event';
export {
  AnalyticsFeatureKind,
  provideAnalytics,
  withCustomBackend,
  withGlobalErrorHandler,
  withInitialPermissions,
  withPermissionedStorageConfig,
  withPermissionedStorageKeys,
  withPermissionsConfig,
  type AnalyticsFeature,
} from './lib/provider';
export { EVENT_SCOPE, EventScope, provideEventScope, type IEventScope } from './lib/scope';
