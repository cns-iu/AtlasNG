import { AnalyticsBackend } from '@atlasng/analytics';

/**
 * Analytics backend that drops every event, so the showcase never sends telemetry.
 */
export class NoopAnalyticsBackend implements AnalyticsBackend {
  /**
   * Ignores a page view.
   *
   * @returns A resolved promise.
   */
  async page(): Promise<void> {
    return;
  }

  /**
   * Ignores an event.
   *
   * @returns A resolved promise.
   */
  async track(): Promise<void> {
    return;
  }
}
