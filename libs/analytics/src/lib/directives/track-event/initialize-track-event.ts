import {
  assertInInjectionContext,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  Renderer2,
  runInInjectionContext,
  untracked,
} from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import { injectTrackEvent, TrackEventFn } from '../../inject-track-event';
import type { AnalyticsEventTrackingDef } from '../track-event';

/**
 * A source of trigger notifications, such as a component output, an `EventEmitter`, or an RxJS observable.
 * Emitted values are ignored, so sources can emit objects that cannot be serialized.
 */
export interface TrackEventSource {
  /**
   * Subscribes to the source.
   *
   * @param next Callback invoked on each emission
   * @returns A subscription that stops the notifications
   */
  subscribe(next: (value: unknown) => void): { unsubscribe(): void };
}

/** Triggers keyed by name: `true` listens for the DOM event of that name on the host element, a source subscribes to it. */
export type TrackEventTriggers = Record<string, TrackEventSource | true>;

/** Trigger input accepted by the tracking directives. `'change'`, `['change']`, and `{ change: true }` are equivalent. */
export type TrackEventTriggersInput = string | string[] | TrackEventTriggers;

/** Settings shared by the single-event and multi-event configurations. */
interface BaseTrackEventConfig {
  /** Delay in milliseconds that each trigger waits for a pause before tracking. Tracks immediately when unset. */
  debounce?: () => number | undefined;
  /** Whether tracking is disabled. */
  disabled?: () => boolean;
  /** Injector to use instead of the current injection context. */
  injector?: Injector;
}

/** Configuration for tracking a single analytics event. */
export interface TrackEventConfig<E extends AnalyticsEvent> extends BaseTrackEventConfig {
  /** The analytics event, or a function returning it. */
  event: E | (() => E);
  /** The event payload. */
  payload?: () => AnalyticsEventPayloadFor<E>;
  /** Additional options to pass to the analytics backend. */
  options?: () => Record<string, unknown> | undefined;
  /** The triggers that log the event. */
  on: () => TrackEventTriggers;
}

/** Configuration for tracking several analytics events on one element. */
export interface MultiTrackEventConfig<E extends AnalyticsEvent> extends BaseTrackEventConfig {
  /** The event definitions. */
  events: () => AnalyticsEventTrackingDef<E>[];
}

/** A trigger with the callback that tracks its events. */
interface TriggerBinding {
  /** The trigger name. */
  name: string;
  /** `true` for a DOM event on the host element, otherwise the source to subscribe to. */
  source: TrackEventSource | true;
  /** Tracks the events for one activation of the trigger. */
  fire: (triggerData?: unknown) => void;
}

/**
 * Builds the payload sent for a trigger activation.
 *
 * @param payload The configured payload
 * @param trigger The trigger name
 * @param triggerData The DOM event, when the trigger is a DOM event
 * @returns The payload with trigger metadata
 */
function withTrigger<P>(payload: P, trigger: string, triggerData: unknown): P {
  return triggerData === undefined ? { ...payload, trigger } : { ...payload, trigger, triggerData };
}

/**
 * Creates the trigger bindings for a single-event configuration.
 *
 * @param config The configuration
 * @param track Tracks events under the current scope
 * @returns The bindings for the current triggers
 */
function singleBindings<E extends AnalyticsEvent>(config: TrackEventConfig<E>, track: TrackEventFn): TriggerBinding[] {
  const { event, payload, options } = config;
  return Object.entries(config.on()).map(([name, source]) => ({
    name,
    source,
    fire: (triggerData) => {
      const eventValue = typeof event === 'function' ? event() : event;
      const payloadValue = payload?.() ?? ({} as AnalyticsEventPayloadFor<E>);
      track(eventValue, withTrigger(payloadValue, name, triggerData), options?.());
    },
  }));
}

/**
 * Creates the trigger bindings for a multi-event configuration, one per trigger name.
 *
 * @param config The configuration
 * @param track Tracks events under the current scope
 * @returns The bindings for the current definitions
 */
function multiBindings<E extends AnalyticsEvent>(
  config: MultiTrackEventConfig<E>,
  track: TrackEventFn,
): TriggerBinding[] {
  const groups = new Map<string, AnalyticsEventTrackingDef<E>[]>();
  for (const def of config.events()) {
    groups.set(def.trigger, [...(groups.get(def.trigger) ?? []), def]);
  }

  return [...groups].map(([name, defs]) => ({
    name,
    source: defs.find((def) => def.source)?.source ?? true,
    fire: (triggerData) => {
      for (const def of defs) {
        track(def.event, withTrigger(def.payload, name, triggerData), def.options);
      }
    },
  }));
}

/**
 * Registers a trigger binding.
 *
 * @param binding The binding to register
 * @param element The host element for DOM triggers
 * @param renderer The renderer used to listen for DOM events
 * @param delay The debounce delay in milliseconds, if any
 * @returns A function that removes the registration
 */
function register(binding: TriggerBinding, element: Element, renderer: Renderer2, delay?: number): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const fire = delay
    ? (triggerData?: unknown) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => binding.fire(triggerData), delay);
      }
    : binding.fire;

  const remove =
    binding.source === true
      ? renderer.listen(element, binding.name, (event: unknown) => fire(event))
      : (() => {
          const subscription = binding.source.subscribe(() => fire());
          return () => subscription.unsubscribe();
        })();

  return () => {
    clearTimeout(timeout);
    remove();
  };
}

/**
 * Initializes event tracking on the host element.
 *
 * Triggers are registered again whenever the triggers, debounce, or disabled state change.
 * Payloads and options are read when a trigger fires. On destroy, triggers are removed
 * after a macrotask so events dispatched during teardown, such as `blur`, are still tracked.
 *
 * @param config The single-event or multi-event configuration
 * @throws When called outside an injection context without an `injector`
 */
export function initializeTrackEvent<E extends AnalyticsEvent>(
  config: TrackEventConfig<E> | MultiTrackEventConfig<E>,
): void {
  if (!config.injector) {
    assertInInjectionContext(initializeTrackEvent);
  }

  const setup = () => {
    const element = inject(ElementRef).nativeElement as Element;
    const renderer = inject(Renderer2);
    const track = injectTrackEvent();
    let cleanups: (() => void)[] = [];
    const teardown = () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanups = [];
    };

    effect(() => {
      const bindings = config.disabled?.()
        ? []
        : 'events' in config
          ? multiBindings(config, track)
          : singleBindings(config, track);
      const delay = config.debounce?.();

      untracked(() => {
        teardown();
        cleanups = bindings.map((binding) => register(binding, element, renderer, delay));
      });
    });

    inject(DestroyRef).onDestroy(() => setTimeout(teardown));
  };

  if (config.injector) {
    runInInjectionContext(config.injector, setup);
  } else {
    setup();
  }
}
