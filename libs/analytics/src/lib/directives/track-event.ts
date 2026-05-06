import { booleanAttribute, computed, Directive, input } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventPayloadFor, CoreEvents } from '@atlasng/analytics/events';
import { MultiTrackEventBase } from './multi-track-event';

/**
 * A utility function for normalizing the payload input on specialized tracking directives.
 *
 * @param payload The input payload, which can be an empty string or a valid payload object.
 * @returns An empty object if the input is an empty string, or the original payload otherwise.
 */
export function payloadAttribute<E extends AnalyticsEvent>(
  payload: AnalyticsEventPayloadFor<E> | '',
): AnalyticsEventPayloadFor<E> {
  return payload === '' ? ({} as AnalyticsEventPayloadFor<E>) : payload;
}

/**
 * A base class for directives that track a single analytics event.
 * Use this base class when creating specialized single event tracking directives (e.g. TrackClick).
 */
@Directive()
export abstract class TrackEventBase<E extends AnalyticsEvent> extends MultiTrackEventBase<E> {
  /** The analytics event to track. */
  protected abstract readonly event: () => E;
  /** The payload to log with the analytics event. */
  protected abstract readonly payload: () => AnalyticsEventPayloadFor<E>;
  /** Additional options to pass to the analytics backend. */
  protected abstract readonly options: () => Record<string, unknown> | undefined;
  /** The DOM event that should trigger the analytics event to be logged. */
  protected abstract readonly on: () => string | string[];
  /** A flag indicating whether the directive is disabled. */
  protected abstract readonly disabled: () => boolean;

  /** The event definition for the single event to track. */
  protected override readonly eventDefs = computed(() => {
    if (this.disabled() || this.on() === '') {
      return [];
    }

    const event = this.event();
    const payload = this.payload();
    const options = this.options();
    const on = this.on();
    const triggers = Array.isArray(on) ? on : [on];
    return triggers.map((trigger) => ({ event, payload, options, trigger }));
  });
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
export class TrackEvent<E extends AnalyticsEvent> extends TrackEventBase<E> {
  /** The analytics event to track. */
  override readonly event = input.required<E>({ alias: `angTrackEvent` });
  /** The payload to log with the analytics event. */
  override readonly payload = input.required<AnalyticsEventPayloadFor<E>>({ alias: `angTrackEventPayload` });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackEventOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input.required<string | string[]>({ alias: `angTrackEventOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackEventDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a blur event. */
@Directive({
  selector: '[angTrackBlur]',
  exportAs: 'angTrackBlur',
})
export class TrackBlur extends TrackEventBase<CoreEvents.Blur> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Blur;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackBlur`, transform: payloadAttribute<CoreEvents.Blur> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackBlurOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('blur', { alias: `angTrackBlurOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackBlurDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a change event. */
@Directive({
  selector: '[angTrackChange]',
  exportAs: 'angTrackChange',
})
export class TrackChange extends TrackEventBase<CoreEvents.Change> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Change;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackChange`, transform: payloadAttribute<CoreEvents.Change> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackChangeOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('change', { alias: `angTrackChangeOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackChangeDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a click event. */
@Directive({
  selector: '[angTrackClick]',
  exportAs: 'angTrackClick',
})
export class TrackClick extends TrackEventBase<CoreEvents.Click> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Click;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackClick`, transform: payloadAttribute<CoreEvents.Click> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackClickOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('click', { alias: `angTrackClickOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackClickDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a double-click event. */
@Directive({
  selector: '[angTrackDoubleClick]',
  exportAs: 'angTrackDoubleClick',
})
export class TrackDoubleClick extends TrackEventBase<CoreEvents.DoubleClick> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.DoubleClick;
  /** The payload to log with the analytics event. */
  override readonly payload = input(
    {},
    { alias: `angTrackDoubleClick`, transform: payloadAttribute<CoreEvents.DoubleClick> },
  );
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackDoubleClickOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('dblclick', { alias: `angTrackDoubleClickOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackDoubleClickDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking an error event. */
@Directive({
  selector: '[angTrackError]',
  exportAs: 'angTrackError',
})
export class TrackError extends TrackEventBase<CoreEvents.Error> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Error;
  /** The payload to log with the analytics event. */
  override readonly payload = input.required<AnalyticsEventPayloadFor<CoreEvents.Error>>({ alias: `angTrackError` });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackErrorOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('error', { alias: `angTrackErrorOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackErrorDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a focus event. */
@Directive({
  selector: '[angTrackFocus]',
  exportAs: 'angTrackFocus',
})
export class TrackFocus extends TrackEventBase<CoreEvents.Focus> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Focus;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackFocus`, transform: payloadAttribute<CoreEvents.Focus> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackFocusOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('focus', { alias: `angTrackFocusOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackFocusDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a hover event. */
@Directive({
  selector: '[angTrackHover]',
  exportAs: 'angTrackHover',
})
export class TrackHover extends TrackEventBase<CoreEvents.Hover> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Hover;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackHover`, transform: payloadAttribute<CoreEvents.Hover> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackHoverOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('mouseenter', { alias: `angTrackHoverOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackHoverDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking an input event. */
@Directive({
  selector: '[angTrackInput]',
  exportAs: 'angTrackInput',
})
export class TrackInput extends TrackEventBase<CoreEvents.Input> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Input;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackInput`, transform: payloadAttribute<CoreEvents.Input> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackInputOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('input', { alias: `angTrackInputOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackInputDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a keyboard event. */
@Directive({
  selector: '[angTrackKeyboard]',
  exportAs: 'angTrackKeyboard',
})
export class TrackKeyboard extends TrackEventBase<CoreEvents.Keyboard> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Keyboard;
  /** The payload to log with the analytics event. */
  override readonly payload = input(
    {},
    { alias: `angTrackKeyboard`, transform: payloadAttribute<CoreEvents.Keyboard> },
  );
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackKeyboardOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('keydown', { alias: `angTrackKeyboardOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackKeyboardDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a reset event. */
@Directive({
  selector: '[angTrackReset]',
  exportAs: 'angTrackReset',
})
export class TrackReset extends TrackEventBase<CoreEvents.Reset> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Reset;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackReset`, transform: payloadAttribute<CoreEvents.Reset> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackResetOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('reset', { alias: `angTrackResetOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackResetDisabled`, transform: booleanAttribute });
}

/** Specialized directive for tracking a submit event. */
@Directive({
  selector: '[angTrackSubmit]',
  exportAs: 'angTrackSubmit',
})
export class TrackSubmit extends TrackEventBase<CoreEvents.Submit> {
  /** The analytics event to track. */
  override readonly event = () => CoreEvents.Submit;
  /** The payload to log with the analytics event. */
  override readonly payload = input({}, { alias: `angTrackSubmit`, transform: payloadAttribute<CoreEvents.Submit> });
  /** Additional options to pass to the analytics backend. */
  override readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackSubmitOptions` });
  /** The DOM event that should trigger the analytics event to be logged. */
  override readonly on = input<string | string[]>('submit', { alias: `angTrackSubmitOn` });
  /** A flag indicating whether the directive is disabled. */
  override readonly disabled = input(false, { alias: `angTrackSubmitDisabled`, transform: booleanAttribute });
}
