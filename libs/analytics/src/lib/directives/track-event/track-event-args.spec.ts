import { signal } from '@angular/core';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import type { AnalyticsEventTrackingDef } from '../track-event';
import {
  getEventTriggers,
  isSingleTrackEventArgs,
  MultiTrackEventArgs,
  SingleTrackEventArgs,
} from './track-event-args';

describe('track-event arguments', () => {
  it('should distinguish single-event and multi-event arguments', () => {
    const singleArgs: SingleTrackEventArgs<CoreEvents.Click> = [
      CoreEvents.Click,
      () => ({}),
      () => undefined,
      () => ['click'],
    ];
    const multiArgs: MultiTrackEventArgs<AnalyticsEvent> = [() => []];

    expect(isSingleTrackEventArgs(singleArgs)).toBe(true);
    expect(isSingleTrackEventArgs(multiArgs)).toBe(false);
  });

  it('should reactively normalize single-event triggers into a set', () => {
    const source = signal(['click', 'click']);
    const args: SingleTrackEventArgs<CoreEvents.Click> = [CoreEvents.Click, () => ({}), () => undefined, source];
    const triggers = getEventTriggers(args);
    const initial = triggers();

    expect([...initial]).toEqual(['click']);

    source.set(['click']);
    expect(triggers()).toBe(initial);

    source.set(['click', 'blur']);
    const resized = triggers();
    expect([...resized]).toEqual(['click', 'blur']);
    expect(resized).not.toBe(initial);

    source.set(['click', 'focus']);
    expect([...triggers()]).toEqual(['click', 'focus']);
    expect(triggers()).not.toBe(resized);
  });

  it('should derive triggers from reactive multi-event definitions', () => {
    const definitions = signal<AnalyticsEventTrackingDef<AnalyticsEvent>[]>([
      { event: CoreEvents.Click, payload: {}, options: undefined, trigger: 'click' },
      { event: CoreEvents.Blur, payload: {}, options: undefined, trigger: 'click' },
    ]);
    const triggers = getEventTriggers<AnalyticsEvent>([definitions]);

    expect([...triggers()]).toEqual(['click']);

    definitions.set([{ event: CoreEvents.Focus, payload: {}, options: undefined, trigger: 'focus' }]);
    expect([...triggers()]).toEqual(['focus']);
  });
});
