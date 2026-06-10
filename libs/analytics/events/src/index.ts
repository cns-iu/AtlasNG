export { CoreEvents, type ErrorAnalyticsEventPayload, type PageViewAnalyticsEventPayload } from './lib/core-events';
export {
  ALLOW_ALL_ANALYTICS_EVENT_CATEGORY_PERMISSIONS,
  ALLOW_NECESSARY_ANALYTICS_EVENT_CATEGORY_PERMISSIONS,
  AnalyticsEventCategory,
  createAnalyticsEvent,
  getAnalyticsEventCategory,
  getAnalyticsEventType,
  type AnalyticsEvent,
  type AnalyticsEventCategoryPermissions,
  type AnalyticsEventPayload,
  type AnalyticsEventPayloadFor,
  type AnalyticsEventType,
} from './lib/event';
