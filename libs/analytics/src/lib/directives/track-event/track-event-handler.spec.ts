import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { Analytics } from '../../analytics';
import { EVENT_SCOPE } from '../../scope';
import { MultiTrackEventArgs, SingleTrackEventArgs } from './track-event-args';
import { TrackEventHandler } from './track-event-handler';

describe('TrackEventHandler', () => {
  function setup<E extends AnalyticsEvent>(args: SingleTrackEventArgs<E> | MultiTrackEventArgs<E>) {
    const trackEvent = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: Analytics, useValue: { trackEvent } },
        {
          provide: EVENT_SCOPE,
          useValue: { name: () => 'scope', path: () => 'root.scope', parentScope: null },
        },
      ],
    });

    const handler = TestBed.runInInjectionContext(() => new TrackEventHandler(args));
    return { handler, trackEvent };
  }

  it('should lazily read single-event values and add trigger metadata', () => {
    const event = signal(CoreEvents.Click);
    const payload = signal({ label: 'initial' });
    const options = signal<Record<string, unknown> | undefined>({ source: 'initial' });
    const args: SingleTrackEventArgs<CoreEvents.Click> = [event, payload, options, () => ['click']];
    const { handler, trackEvent } = setup(args);
    const triggerData = new Event('click');

    payload.set({ label: 'updated' });
    options.set({ source: 'updated' });
    handler.getHandler('click')(triggerData);

    expect(trackEvent).toHaveBeenCalledWith(
      CoreEvents.Click,
      {
        label: 'updated',
        path: 'root.scope',
        trigger: 'click',
        triggerData,
      },
      { source: 'updated' },
    );
  });

  it('should track every multi-event definition matching the trigger', () => {
    const args: MultiTrackEventArgs<AnalyticsEvent> = [
      () => [
        { event: CoreEvents.Click, payload: { order: 1 }, options: undefined, trigger: 'click' },
        { event: CoreEvents.Blur, payload: { order: 2 }, options: { second: true }, trigger: 'click' },
        { event: CoreEvents.Focus, payload: { order: 3 }, options: undefined, trigger: 'focus' },
      ],
    ];
    const { handler, trackEvent } = setup(args);
    const triggerData = new Event('click');

    handler.getHandler('click')(triggerData);

    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenNthCalledWith(
      1,
      CoreEvents.Click,
      { order: 1, path: 'root.scope', trigger: 'click', triggerData },
      undefined,
    );
    expect(trackEvent).toHaveBeenNthCalledWith(
      2,
      CoreEvents.Blur,
      { order: 2, path: 'root.scope', trigger: 'click', triggerData },
      { second: true },
    );
  });
});
