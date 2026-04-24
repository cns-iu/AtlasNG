import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Analytics } from '../analytics';
import { CoreEvents } from '@atlasng/analytics/events';

/**
 * Global error handler that logs unhandled errors as analytics events.
 */
@Injectable({
  providedIn: 'root',
})
export class AnalyticsErrorHandler implements ErrorHandler {
  /** Reference to analytics. */
  private readonly analytics = inject(Analytics);

  /**
   * Log any unhandled error as an analytics event.
   * In development mode, also log the error to the console for easier debugging.
   *
   * @param error Any unhandled error that occurs in the application
   */
  handleError(error: unknown): void {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      // eslint-disable-next-line no-console
      console.error('Unhandled error', error);
    }

    this.analytics.logEvent(CoreEvents.Error, {
      message: 'Unhandled error',
      reason: error,
    });
  }
}
