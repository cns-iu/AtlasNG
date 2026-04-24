import { TestBed } from '@angular/core/testing';
import { Analytics } from '../analytics';
import { AnalyticsErrorHandler } from './error-handler';
import { CoreEvents } from '@atlasng/analytics/events';

describe('AnalyticsErrorHandler', () => {
  const error = new Error('Test error');

  function setup() {
    const analytics = TestBed.inject(Analytics);
    const handler = TestBed.inject(AnalyticsErrorHandler);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logEventSpy = vi.spyOn(analytics, 'logEvent').mockImplementation(() => Promise.resolve());

    return { handler, consoleErrorSpy, logEventSpy };
  }

  it('should log unhandled errors to the console in development mode', () => {
    const { handler, consoleErrorSpy } = setup();
    handler.handleError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unhandled error', error);
  });

  it('should log unhandled errors as analytics events', () => {
    const { handler, logEventSpy } = setup();
    handler.handleError(error);

    expect(logEventSpy).toHaveBeenCalledWith(CoreEvents.Error, {
      message: 'Unhandled error',
      reason: error,
    });
  });
});
