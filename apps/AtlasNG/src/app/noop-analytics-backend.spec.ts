import { NoopAnalyticsBackend } from './noop-analytics-backend';

describe('NoopAnalyticsBackend', () => {
  it('ignores page views and events', async () => {
    const backend = new NoopAnalyticsBackend();

    await expect(backend.page()).resolves.toBeUndefined();
    await expect(backend.track()).resolves.toBeUndefined();
  });
});
