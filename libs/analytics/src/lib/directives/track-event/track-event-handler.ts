import { inject } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import { Analytics } from '../../analytics';
import { EVENT_SCOPE } from '../../scope';
import { isSingleTrackEventArgs, MultiTrackEventArgs, SingleTrackEventArgs, TrackEventArgs } from './track-event-args';

/** Contract for resolving a DOM event handler for an analytics trigger. */
export interface ITrackEventHandler {
  /**
   * Gets the handler for a trigger.
   *
   * @param trigger The trigger name.
   * @returns A handler for the trigger data.
   */
  getHandler(trigger: string): (triggerData: unknown) => void;
}

/** Converts DOM trigger data into analytics tracking calls. */
export class TrackEventHandler<E extends AnalyticsEvent> implements ITrackEventHandler {
  /** The analytics service used to track events. */
  readonly #analytics = inject(Analytics);
  /** The current event scope used to construct tracked paths. */
  readonly #scope = inject(EVENT_SCOPE);
  /** The arguments describing the events handled by this instance. */
  readonly #args: TrackEventArgs<E>;
  /** The single-event or multi-event handler selected for the supplied arguments. */
  readonly #handler: (this: TrackEventHandler<E>, trigger: string, triggerData: unknown) => void;

  /**
   * Creates a track-event handler.
   *
   * @param args The arguments describing the events to track.
   */
  constructor(args: TrackEventArgs<E>) {
    this.#args = args;
    this.#handler = isSingleTrackEventArgs(args) ? this.#handleSingleEvent : this.#handleMultiEvent;
  }

  /**
   * Gets the handler for a trigger.
   *
   * @param trigger The trigger name.
   * @returns A handler for the trigger data.
   */
  getHandler(trigger: string): (triggerData: unknown) => void {
    return this.#handler.bind(this, trigger);
  }

  /**
   * Handles a trigger for the single-event argument form.
   *
   * @param trigger The trigger name.
   * @param triggerData The trigger data.
   */
  #handleSingleEvent(trigger: string, triggerData: unknown): void {
    const [event, payload, options] = this.#args as SingleTrackEventArgs<E>;
    const eventValue = typeof event === 'function' ? event() : event;
    this.#trackEvent(eventValue, payload(), options(), trigger, triggerData);
  }

  /**
   * Handles a trigger for the multi-event argument form.
   *
   * @param trigger The trigger name.
   * @param triggerData The trigger data.
   */
  #handleMultiEvent(trigger: string, triggerData: unknown): void {
    const [events] = this.#args as MultiTrackEventArgs<E>;
    for (const event of events()) {
      if (event.trigger === trigger) {
        this.#trackEvent(event.event, event.payload, event.options, trigger, triggerData);
      }
    }
  }

  /**
   * Sends an analytics event with its scope and trigger metadata.
   *
   * @param event The analytics event.
   * @param payload The event payload.
   * @param options The analytics options.
   * @param trigger The trigger name.
   * @param triggerData The trigger data.
   */
  #trackEvent(
    event: E,
    payload: AnalyticsEventPayloadFor<E>,
    options: Record<string, unknown> | undefined,
    trigger: string,
    triggerData: unknown,
  ): void {
    this.#analytics.trackEvent(
      event,
      {
        ...payload,
        path: this.#scope.path(),
        trigger,
        triggerData,
      },
      options,
    );
  }
}
