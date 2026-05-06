export { Analytics, ANALYTICS_CONFIG, type AnalyticsConfig } from './lib/analytics';
export { ANALYTICS_BACKEND, type AnalyticsBackend } from './lib/backend';
export {
  MultiTrackEvent,
  MultiTrackEventBase,
  type AnalyticsEventTrackingDef,
} from './lib/directives/multi-track-event';
export {
  payloadAttribute,
  TrackBlur,
  TrackChange,
  TrackClick,
  TrackDoubleClick,
  TrackError,
  TrackEvent,
  TrackEventBase,
  TrackFocus,
  TrackHover,
  TrackInput,
  TrackKeyboard,
  TrackReset,
  TrackSubmit,
} from './lib/directives/track-event';
export {
  provideAnalytics,
  withCustomBackend,
  withDefaultBackend,
  withGlobalErrorHandler,
  type AnalyticsFeature,
} from './lib/provider';
export { EVENT_SCOPE, EventScope, provideEventScope, type IEventScope } from './lib/scope';
