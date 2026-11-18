import { Component, EventEmitter, inject, Injector, signal } from '@angular/core';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { fireEvent, render } from '@testing-library/angular';
import { Subject } from 'rxjs';
import { Analytics } from '../../analytics';
import { EVENT_SCOPE } from '../../scope';
import type { AnalyticsEventTrackingDef } from '../track-event';
import { initializeTrackEvent, MultiTrackEventConfig, TrackEventConfig } from './initialize-track-event';

describe('initializeTrackEvent', () => {
  afterEach(() => vi.useRealTimers());

  async function setup<E extends AnalyticsEvent>(createConfig: () => TrackEventConfig<E> | MultiTrackEventConfig<E>) {
    const trackEvent = vi.fn((_event: AnalyticsEvent, _payload: Record<string, unknown>, _options?: unknown) =>
      Promise.resolve(),
    );

    @Component({ selector: 'ang-host', template: '<button type="button">Host</button>' })
    class Host {
      constructor() {
        initializeTrackEvent(createConfig());
      }
    }

    const result = await render(Host, {
      providers: [
        { provide: Analytics, useValue: { trackEvent } },
        { provide: EVENT_SCOPE, useValue: { name: () => 'scope', path: () => 'root.scope', parentScope: null } },
      ],
    });

    return { ...result, host: result.fixture.nativeElement as HTMLElement, trackEvent };
  }

  it('should require an injection context without an injector', () => {
    expect(() => initializeTrackEvent({ event: CoreEvents.Click, on: () => ({ click: true }) })).toThrow();
  });

  it('should track DOM triggers with the scope path and trigger data', async () => {
    const { host, trackEvent } = await setup(() => ({
      event: CoreEvents.Click,
      payload: () => ({ label: 'save' }),
      options: () => ({ source: 'test' }),
      on: () => ({ click: true }),
    }));

    fireEvent.click(host);

    expect(trackEvent).toHaveBeenCalledWith(
      CoreEvents.Click,
      { label: 'save', trigger: 'click', triggerData: expect.any(MouseEvent), path: 'root.scope' },
      { source: 'test' },
    );
  });

  it('should track sources without trigger data and mix them with DOM triggers', async () => {
    const output = new EventEmitter<{ unserializable: object }>();
    const observable = new Subject<number>();
    const { host, trackEvent } = await setup(() => ({
      event: CoreEvents.Change,
      on: () => ({ change: true, selectionChange: output, valueChange: observable }),
    }));

    output.emit({ unserializable: {} });
    observable.next(1);
    fireEvent.change(host);

    expect(trackEvent.mock.calls.map(([, payload]) => payload)).toEqual([
      { trigger: 'selectionChange', path: 'root.scope' },
      { trigger: 'valueChange', path: 'root.scope' },
      { trigger: 'change', triggerData: expect.any(Event), path: 'root.scope' },
    ]);
  });

  it('should read the event, payload, and options when a trigger fires', async () => {
    const event = signal<AnalyticsEvent>(CoreEvents.Click);
    const payload = signal({ label: 'initial' });
    const { host, trackEvent } = await setup(() => ({ event, payload, on: () => ({ click: true }) }));

    event.set(CoreEvents.DoubleClick);
    payload.set({ label: 'updated' });
    fireEvent.click(host);

    expect(trackEvent).toHaveBeenCalledWith(
      CoreEvents.DoubleClick,
      expect.objectContaining({ label: 'updated' }),
      undefined,
    );
  });

  it('should register triggers again when the triggers or disabled state change', async () => {
    const on = signal<Record<string, true>>({ click: true });
    const disabled = signal(false);
    const { host, trackEvent, fixture } = await setup(() => ({ event: CoreEvents.Click, on, disabled }));

    on.set({ focus: true });
    fixture.detectChanges();
    fireEvent.click(host);
    fireEvent.focus(host);
    expect(trackEvent).toHaveBeenCalledOnce();

    disabled.set(true);
    fixture.detectChanges();
    fireEvent.focus(host);
    expect(trackEvent).toHaveBeenCalledOnce();
  });

  it('should debounce each trigger', async () => {
    vi.useFakeTimers();
    const output = new EventEmitter<void>();
    const { host, trackEvent } = await setup(() => ({
      event: CoreEvents.Input,
      on: () => ({ input: true, valueChange: output }),
      debounce: () => 300,
    }));

    fireEvent.input(host);
    fireEvent.input(host);
    output.emit();
    vi.advanceTimersByTime(299);
    expect(trackEvent).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(trackEvent.mock.calls.map(([, payload]) => payload['trigger'])).toEqual(['input', 'valueChange']);
  });

  it('should keep triggers registered until a macrotask after destroy', async () => {
    vi.useFakeTimers();
    const { host, trackEvent, fixture } = await setup(() => ({ event: CoreEvents.Blur, on: () => ({ blur: true }) }));

    fixture.destroy();
    fireEvent.blur(host);
    expect(trackEvent).toHaveBeenCalledOnce();

    vi.runAllTimers();
    fireEvent.blur(host);
    expect(trackEvent).toHaveBeenCalledOnce();
  });

  it('should group multi-event definitions by trigger and support sources', async () => {
    const output = new EventEmitter<void>();
    const events = signal<AnalyticsEventTrackingDef<AnalyticsEvent>[]>([
      { event: CoreEvents.Click, payload: { order: 1 }, options: undefined, trigger: 'click' },
      { event: CoreEvents.Focus, payload: { order: 2 }, options: { second: true }, trigger: 'click' },
      {
        event: CoreEvents.Change,
        payload: { order: 3 },
        options: undefined,
        trigger: 'selectionChange',
        source: output,
      },
    ]);
    const { host, trackEvent } = await setup(() => ({ events }));

    fireEvent.click(host);
    output.emit();

    expect(trackEvent.mock.calls).toEqual([
      [
        CoreEvents.Click,
        { order: 1, trigger: 'click', triggerData: expect.any(MouseEvent), path: 'root.scope' },
        undefined,
      ],
      [
        CoreEvents.Focus,
        { order: 2, trigger: 'click', triggerData: expect.any(MouseEvent), path: 'root.scope' },
        { second: true },
      ],
      [CoreEvents.Change, { order: 3, trigger: 'selectionChange', path: 'root.scope' }, undefined],
    ]);
  });

  it('should run outside an injection context when given an injector', async () => {
    const output = new EventEmitter<void>();
    let injector!: Injector;
    const { trackEvent, fixture } = await setup(() => {
      injector = inject(Injector);
      return { event: CoreEvents.Click, on: () => ({}) };
    });

    initializeTrackEvent({ event: CoreEvents.Change, on: () => ({ selectionChange: output }), injector });
    fixture.detectChanges();
    output.emit();

    expect(trackEvent).toHaveBeenCalledWith(
      CoreEvents.Change,
      { trigger: 'selectionChange', path: 'root.scope' },
      undefined,
    );
  });
});
