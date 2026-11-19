import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  Renderer2,
  Signal,
  untracked,
} from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import { MaybeSignalLike } from '@atlasng/core';
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
}

/** Configuration for tracking a single analytics event. */
export interface TrackEventConfig<E extends AnalyticsEvent> extends BaseTrackEventConfig {
  /** The analytics event, or a function returning it. */
  event: MaybeSignalLike<E>;
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

/** What a registration listens to: a trigger name and its source. */
interface TriggerKey {
  /** The trigger name. */
  trigger: string;
  /** `true` for a DOM event on the host element, otherwise the source to subscribe to. */
  source: TrackEventSource | true;
}

/** A trigger with the callback that tracks its events. */
interface TriggerBinding extends TriggerKey {
  /** Tracks the events for one activation of the trigger. */
  fire: (triggerData?: unknown) => void;
}

/**
 * Initializes event tracking on the host element.
 *
 * Triggers are registered again only when the trigger names or sources, debounce, or disabled
 * state change. Events, payloads, and options are read when a trigger fires. Values that sources
 * emit synchronously on subscribe, such as a `BehaviorSubject` replay, are ignored.
 *
 * Pending debounced calls are flushed when triggers are registered again and on destroy, and
 * dropped when tracking is disabled. On destroy, triggers are removed after a macrotask so events
 * dispatched during teardown, such as `blur`, are still tracked.
 *
 * Triggers are registered on the first change detection, so events dispatched before it are not tracked.
 *
 * @param config The single-event or multi-event configuration, such as a directive whose members match it
 * @param options Additional options which can include an `injector` to use instead of the current injection context
 * @throws When called outside an injection context without an `injector`
 */
export function initializeTrackEvent<E extends AnalyticsEvent>(
  config: TrackEventConfig<E> | MultiTrackEventConfig<E>,
  options?: { injector?: Injector },
): void {
  if (!options?.injector) {
    assertInInjectionContext(initializeTrackEvent);
  }

  const injector = options?.injector ?? inject(Injector);
  const element = injector.get(ElementRef).nativeElement as Node;
  const renderer = injector.get(Renderer2);
  const track = injectTrackEvent({ injector });
  const bindings = 'events' in config ? createMultiBindings(config, track) : createSingleBindings(config, track);
  let cleanups: ((flush: boolean) => void)[] = [];
  let warnedNonElementHost = false;
  const teardown = (flush: boolean) => {
    cleanups.forEach((cleanup) => cleanup(flush));
    cleanups = [];
  };

  effect(
    () => {
      const disabled = config.disabled?.() ?? false;
      const active = disabled ? [] : bindings();
      const delay = config.debounce?.();

      if (
        (typeof ngDevMode === 'undefined' || ngDevMode) &&
        !warnedNonElementHost &&
        element.nodeType !== Node.ELEMENT_NODE &&
        active.some((binding) => binding.source === true)
      ) {
        const triggerNames = active
          .filter((binding) => binding.source === true)
          .map((binding) => `'${binding.trigger}'`)
          .join(', ');
        // eslint-disable-next-line no-console
        console.warn(
          `Analytics: DOM triggers (${triggerNames}) are registered on a host that is not an element, ` +
            'such as <ng-container>, and will never fire. ' +
            'Use a source instead or move the directive to an element.',
        );

        warnedNonElementHost = true;
      }

      untracked(() => {
        teardown(!disabled);
        cleanups = active.map((binding) => registerBinding(binding, element, renderer, delay));
      });
    },
    { injector },
  );

  injector.get(DestroyRef).onDestroy(() => setTimeout(() => teardown(true)));
}

/**
 * Creates the trigger bindings for a single-event configuration, one per trigger.
 * Only the triggers are tracked; the event, payload, and options are read when a trigger fires.
 *
 * @param config The single-event configuration
 * @param track Tracks events under the host's event scope
 * @returns A signal of the bindings for the current triggers
 */
function createSingleBindings<E extends AnalyticsEvent>(
  config: TrackEventConfig<E>,
  track: TrackEventFn,
): Signal<TriggerBinding[]> {
  const { event, payload, options, on } = config;
  const eventFn = typeof event === 'function' ? event : () => event;
  const keys = computed(() => Object.entries(on()).map(([trigger, source]) => ({ trigger, source })), {
    equal: triggerKeysEqual,
  });

  return computed(() =>
    keys().map(({ trigger, source }) => ({
      trigger,
      source,
      fire: (triggerData) => {
        track(eventFn(), buildPayload(trigger, triggerData, payload?.()), options?.());
      },
    })),
  );
}

/**
 * Creates the trigger bindings for a multi-event configuration, one per distinct trigger and source.
 * Only the triggers and sources are tracked, so definitions whose payloads change do not cause
 * registrations, or pending debounced calls, to be reset. Definitions are read when a trigger fires.
 *
 * @param config The multi-event configuration
 * @param track Tracks events under the host's event scope
 * @returns A signal of the bindings for the current definitions
 */
function createMultiBindings<E extends AnalyticsEvent>(
  config: MultiTrackEventConfig<E>,
  track: TrackEventFn,
): Signal<TriggerBinding[]> {
  const { events } = config;
  const keys = computed(
    () => {
      const result: TriggerKey[] = [];
      for (const { trigger, source = true } of events()) {
        if (!result.some((key) => key.trigger === trigger && key.source === source)) {
          result.push({ trigger, source });
        }
      }

      return result;
    },
    { equal: triggerKeysEqual },
  );

  return computed(() =>
    keys().map(({ trigger, source }) => ({
      trigger,
      source,
      fire: (triggerData) => {
        for (const def of untracked(events)) {
          if (def.trigger === trigger && (def.source ?? true) === source) {
            track(def.event, buildPayload(trigger, triggerData, def.payload), def.options);
          }
        }
      },
    })),
  );
}

/**
 * Compares trigger keys by trigger name and source identity.
 *
 * @param a The previous keys
 * @param b The next keys
 * @returns Whether both lists register the same triggers in the same order
 */
function triggerKeysEqual(a: TriggerKey[], b: TriggerKey[]): boolean {
  return (
    a.length === b.length && a.every((key, index) => key.trigger === b[index].trigger && key.source === b[index].source)
  );
}

/** Marks that a debounced binding has no pending call. */
const NO_PENDING_CALL = Symbol('NO_PENDING_CALL');

/**
 * Listens for a binding's DOM event on the host element or subscribes to its source.
 * Emissions delivered synchronously during `subscribe` are ignored, so replayed values are not tracked.
 *
 * @param binding The binding to register
 * @param element The host element for DOM triggers
 * @param renderer The renderer used to listen for DOM events
 * @param delay The debounce delay in milliseconds; tracks immediately unless finite and positive
 * @returns A function that removes the registration and either runs (`flush`) or cancels any pending debounced call
 */
function registerBinding(
  binding: TriggerBinding,
  element: Node,
  renderer: Renderer2,
  delay?: number,
): (flush: boolean) => void {
  let fire = binding.fire;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let pending: unknown = NO_PENDING_CALL;
  let removeBinding: () => void;

  if (delay !== undefined && Number.isFinite(delay) && delay > 0) {
    fire = (triggerData) => {
      clearTimeout(timeout);
      pending = triggerData;
      timeout = setTimeout(() => {
        pending = NO_PENDING_CALL;
        binding.fire(triggerData);
      }, delay);
    };
  }

  if (binding.source === true) {
    removeBinding = renderer.listen(element, binding.trigger, fire);
  } else {
    let subscribing = true;
    const subscription = binding.source.subscribe(() => {
      if (!subscribing) {
        fire();
      }
    });
    subscribing = false;
    removeBinding = () => subscription.unsubscribe();
  }

  return (flush) => {
    clearTimeout(timeout);
    removeBinding();
    if (flush && pending !== NO_PENDING_CALL) {
      const triggerData = pending;
      pending = NO_PENDING_CALL;
      binding.fire(triggerData);
    }
  };
}

/**
 * Adds trigger metadata to a payload.
 *
 * @param trigger The trigger name
 * @param triggerData The DOM event, or `undefined` for source triggers
 * @param payload The configured payload
 * @returns A copy of the payload with `trigger`, and `triggerData` when defined
 */
function buildPayload<P>(trigger: string, triggerData: unknown, payload: P | undefined): P {
  return (triggerData === undefined ? { ...payload, trigger } : { ...payload, trigger, triggerData }) as P;
}
