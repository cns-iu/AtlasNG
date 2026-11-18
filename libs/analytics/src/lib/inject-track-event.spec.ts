import { TestBed } from '@angular/core/testing';
import { CoreEvents } from '@atlasng/analytics/events';
import { Analytics } from './analytics';
import { injectTrackEvent } from './inject-track-event';
import { EVENT_SCOPE } from './scope';

describe('injectTrackEvent', () => {
  function setup() {
    const trackEvent = vi.fn(() => Promise.resolve());
    TestBed.configureTestingModule({
      providers: [
        { provide: Analytics, useValue: { trackEvent } },
        { provide: EVENT_SCOPE, useValue: { name: () => 'scope', path: () => 'root.scope', parentScope: null } },
      ],
    });

    const track = TestBed.runInInjectionContext(() => injectTrackEvent());
    return { track, trackEvent };
  }

  it('should require an injection context', () => {
    expect(() => injectTrackEvent()).toThrow();
  });

  it('should track events with the scope path', () => {
    const { track, trackEvent } = setup();

    track(CoreEvents.Change, { trigger: 'selectionChange', path: 'ignored' }, { source: 'test' });

    expect(trackEvent).toHaveBeenCalledWith(
      CoreEvents.Change,
      { trigger: 'selectionChange', path: 'root.scope' },
      { source: 'test' },
    );
  });
});
