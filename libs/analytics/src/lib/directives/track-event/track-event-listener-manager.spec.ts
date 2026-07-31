import { ElementRef, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ITrackEventHandler } from './track-event-handler';
import { TrackEventListenerManager } from './track-event-listener-manager';

describe('TrackEventListenerManager', () => {
  afterEach(() => vi.useRealTimers());

  function setup() {
    const element = document.createElement('button');
    const handlers = new Map<string, (triggerData: unknown) => void>();
    const unlisteners = new Map<string, ReturnType<typeof vi.fn>>();
    const getHandler = vi.fn((trigger: string) => {
      const handler = vi.fn();
      handlers.set(trigger, handler);
      return handler;
    });
    const listen = vi.fn((_element: Element, trigger: string, _handler: (triggerData: unknown) => void) => {
      const unlisten = vi.fn();
      unlisteners.set(trigger, unlisten);
      return unlisten;
    });
    const handler: ITrackEventHandler = { getHandler };

    TestBed.configureTestingModule({
      providers: [
        { provide: ElementRef, useValue: new ElementRef(element) },
        { provide: Renderer2, useValue: { listen } },
      ],
    });

    const manager = TestBed.runInInjectionContext(() => new TrackEventListenerManager(handler));
    return { element, getHandler, handlers, listen, manager, unlisteners };
  }

  it('should add each trigger listener only once', () => {
    const { element, getHandler, handlers, listen, manager } = setup();

    manager.addListeners(new Set(['click', 'focus']));
    manager.addListeners(new Set(['click']));

    expect(getHandler).toHaveBeenCalledTimes(2);
    expect(listen).toHaveBeenCalledTimes(2);
    expect(listen).toHaveBeenCalledWith(element, 'click', handlers.get('click'));
    expect(listen).toHaveBeenCalledWith(element, 'focus', handlers.get('focus'));
  });

  it('should reconcile listeners while retaining unchanged triggers', () => {
    const { listen, manager, unlisteners } = setup();

    manager.updateListeners(new Set(['click', 'focus']));
    const clickUnlisten = unlisteners.get('click');
    const focusUnlisten = unlisteners.get('focus');
    manager.updateListeners(new Set(['focus', 'blur']));

    expect(clickUnlisten).toHaveBeenCalledOnce();
    expect(focusUnlisten).not.toHaveBeenCalled();
    expect(listen).toHaveBeenCalledTimes(3);

    manager.removeListeners();
    expect(focusUnlisten).toHaveBeenCalledOnce();
    expect(unlisteners.get('blur')).toHaveBeenCalledOnce();
  });

  it('should defer listener cleanup during destruction', () => {
    vi.useFakeTimers();
    const { manager, unlisteners } = setup();

    manager.addListeners(new Set(['click']));
    const unlisten = unlisteners.get('click');
    manager.destroy();

    expect(unlisten).not.toHaveBeenCalled();

    vi.runAllTimers();
    expect(unlisten).toHaveBeenCalledOnce();
  });
});
