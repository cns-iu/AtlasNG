import { booleanAttribute, computed, Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor } from '@atlasng/analytics/events';
import { Analytics } from '../analytics';
import { EVENT_SCOPE } from '../scope';

/** Definition for tracking an analytics event using the MultiTrackEvent directive. */
export interface AnalyticsEventTrackingDef<E extends AnalyticsEvent> {
  /** The analytics event to track. */
  event: E;
  /** The payload to log with the analytics event. */
  payload: AnalyticsEventPayloadFor<E>;
  /** Additional options to pass to the analytics backend. */
  options: Record<string, unknown> | undefined;
  /** The DOM event that should trigger the analytics event to be logged. */
  trigger: string;
}

/**
 * A base class for directives that track multiple analytics events.
 */
@Directive()
export abstract class MultiTrackEventBase<E extends AnalyticsEvent> {
  /** A list of event to track. */
  protected abstract readonly eventDefs: () => AnalyticsEventTrackingDef<E>[];

  /** The analytics service instance. */
  protected readonly analytics = inject(Analytics);
  /** The current event scope. */
  protected readonly scope = inject(EVENT_SCOPE);
  /** The host element to which the directive is applied. */
  protected readonly el = inject(ElementRef).nativeElement as Element;
  /** The renderer used to add event listeners. */
  protected readonly renderer = inject(Renderer2);

  /**
   * Initializes the directive and sets up event listeners.
   */
  constructor() {
    effect((onCleanup) => {
      for (const def of this.eventDefs()) {
        const handler = this.getHandler(def);
        const unlisten = this.renderer.listen(this.el, def.trigger, handler);

        // Delay cleanup to ensure that events are fully processed.
        // Otherwise, if the directive is destroyed in response to the event it won't get tracked.
        onCleanup(() => setTimeout(unlisten));
      }
    });
  }

  /**
   * Create an event handler function for the given event definition.
   */
  private getHandler(def: AnalyticsEventTrackingDef<E>): (data: unknown) => void {
    return (data) =>
      void this.analytics.trackEvent(
        def.event,
        {
          ...def.payload,
          path: this.scope.path(),
          trigger: def.trigger,
          triggerData: data,
        },
        def.options,
      );
  }
}

/**
 * A directive for tracking multiple analytics events on a single element.
 */
@Directive({
  selector: '[angMultiTrackEvent]',
  exportAs: 'angMultiTrackEvent',
})
export class MultiTrackEvent<E extends AnalyticsEvent> extends MultiTrackEventBase<E> {
  /** The list of events to track. */
  readonly events = input.required<AnalyticsEventTrackingDef<E>[]>({ alias: `angMultiTrackEvent` });
  /** Whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angMultiTrackEventDisabled`, transform: booleanAttribute });

  /** The event definitions for the events to track. */
  protected override readonly eventDefs = computed(() => (this.disabled() ? [] : this.events()));
}
