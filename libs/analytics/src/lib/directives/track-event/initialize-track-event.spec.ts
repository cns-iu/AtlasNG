import { ElementRef, Renderer2, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnalyticsEvent, CoreEvents } from '@atlasng/analytics/events';
import { Analytics } from '../../analytics';
import { EVENT_SCOPE } from '../../scope';
import type { AnalyticsEventTrackingDef } from '../track-event';
import { initializeTrackEvent } from './initialize-track-event';

describe('initializeTrackEvent', () => {
  afterEach(() => vi.useRealTimers());

  function setup() {
    const element = document.createElement('button');
    const unlisteners = new Map<string, ReturnType<typeof vi.fn>>();
    const listen = vi.fn((_element: Element, trigger: string) => {
      const unlisten = vi.fn();
      unlisteners.set(trigger, unlisten);
      return unlisten;
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Analytics, useValue: { trackEvent: vi.fn() } },
        { provide: EVENT_SCOPE, useValue: { name: () => '', path: () => '', parentScope: null } },
        { provide: ElementRef, useValue: new ElementRef(element) },
        { provide: Renderer2, useValue: { listen } },
      ],
    });

    return { listen, unlisteners };
  }

  it('should require an injection context', () => {
    expect(() =>
      initializeTrackEvent(
        CoreEvents.Click,
        () => ({}),
        () => undefined,
        () => ['click'],
      ),
    ).toThrow();
  });

  it('should reconcile single-event listeners with optional disabled state', () => {
    const { listen, unlisteners } = setup();
    const triggers = signal(['click']);
    const disabled = signal(true);

    TestBed.runInInjectionContext(() =>
      initializeTrackEvent(
        CoreEvents.Click,
        () => ({}),
        () => undefined,
        triggers,
        disabled,
      ),
    );
    TestBed.flushEffects();
    expect(listen).not.toHaveBeenCalled();

    disabled.set(false);
    TestBed.flushEffects();
    expect(listen).toHaveBeenCalledOnce();
    expect(listen.mock.calls[0][1]).toBe('click');

    triggers.set(['focus']);
    TestBed.flushEffects();
    expect(unlisteners.get('click')).toHaveBeenCalledOnce();
    expect(listen.mock.calls[1][1]).toBe('focus');

    disabled.set(true);
    TestBed.flushEffects();
    expect(unlisteners.get('focus')).toHaveBeenCalledOnce();
  });

  it('should initialize multi-event listeners without a disabled source', () => {
    const { listen } = setup();
    const definitions = signal<AnalyticsEventTrackingDef<AnalyticsEvent>[]>([
      { event: CoreEvents.Click, payload: {}, options: undefined, trigger: 'click' },
      { event: CoreEvents.Blur, payload: {}, options: undefined, trigger: 'click' },
    ]);

    TestBed.runInInjectionContext(() => initializeTrackEvent(definitions));
    TestBed.flushEffects();

    expect(listen).toHaveBeenCalledOnce();
    expect(listen.mock.calls[0][1]).toBe('click');
  });

  it('should clean up listeners when the injection context is destroyed', () => {
    vi.useFakeTimers();
    const { unlisteners } = setup();

    TestBed.runInInjectionContext(() =>
      initializeTrackEvent(
        CoreEvents.Click,
        () => ({}),
        () => undefined,
        () => ['click'],
      ),
    );
    TestBed.flushEffects();
    const unlisten = unlisteners.get('click');

    TestBed.resetTestingModule();
    expect(unlisten).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(unlisten).toHaveBeenCalledOnce();
  });
});
