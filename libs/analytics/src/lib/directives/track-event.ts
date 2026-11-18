import { booleanAttribute, Directive, input } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import { initializeTrackEvent, TrackEventSource } from './track-event/initialize-track-event';
import { debounceAttribute, triggersAttribute } from './track-event/track-event-transforms';

/** Definition for tracking an analytics event using the MultiTrackEvent directive. */
export interface AnalyticsEventTrackingDef<E extends AnalyticsEvent> {
  /** The analytics event to track. */
  event: E;
  /** The payload to log with the analytics event. */
  payload: AnalyticsEventPayloadFor<E>;
  /** Additional options to pass to the analytics backend. */
  options: Record<string, unknown> | undefined;
  /** The DOM event that should trigger the analytics event to be logged, or the name of `source`. */
  trigger: string;
  /** A source, such as a component output, to subscribe to instead of listening for a DOM event. */
  source?: TrackEventSource;
}

/**
 * A directive for tracking a single analytics event.
 * For core events, consider using the more specific directives such as `TrackClick`, `TrackInput`, etc.
 * For tracking multiple events, consider using `MultiTrackEvent` instead.
 */
@Directive({
  selector: '[angTrackEvent]',
  exportAs: 'angTrackEvent',
})
export class TrackEvent<E extends AnalyticsEvent> {
  /** The analytics event to track. */
  readonly event = input.required<E>({ alias: `angTrackEvent` });
  /** The payload to log with the analytics event. */
  readonly payload = input.required<AnalyticsEventPayloadFor<E>>({ alias: `angTrackEventPayload` });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackEventOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input.required({ alias: `angTrackEventOn`, transform: triggersAttribute });
  /** Delay in milliseconds that each trigger waits for a pause before tracking. */
  readonly debounce = input(undefined, { alias: `angTrackEventDebounce`, transform: debounceAttribute });
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackEventDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent(this);
  }
}

/** A directive for tracking multiple analytics events on a single element. */
@Directive({
  selector: '[angMultiTrackEvent]',
  exportAs: 'angMultiTrackEvent',
})
export class MultiTrackEvent<E extends AnalyticsEvent> {
  /** The list of events to track. */
  readonly events = input.required<AnalyticsEventTrackingDef<E>[]>({ alias: `angMultiTrackEvent` });
  /** Delay in milliseconds that each trigger waits for a pause before tracking. */
  readonly debounce = input(undefined, { alias: `angMultiTrackEventDebounce`, transform: debounceAttribute });
  /** Whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angMultiTrackEventDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent(this);
  }
}
