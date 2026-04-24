export { Analytics, ANALYTICS_CONFIG, type AnalyticsConfig } from './lib/analytics';
export { ANALYTICS_BACKEND, type AnalyticsBackend } from './lib/backend';
export {
  provideAnalytics,
  withCustomBackend,
  withDefaultBackend,
  withGlobalErrorHandler,
  type AnalyticsFeature,
} from './lib/provider';
export { EVENT_SCOPE, EventScope, provideEventScope, type IEventScope } from './lib/scope';
