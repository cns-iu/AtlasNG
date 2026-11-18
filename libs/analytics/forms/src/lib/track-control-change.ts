import { booleanAttribute, Directive, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { debounceAttribute, initializeTrackEvent, payloadAttribute, TrackEventSource } from '@atlasng/analytics';
import { AnalyticsErrorCode } from '@atlasng/analytics/errors';
import { CoreEvents } from '@atlasng/analytics/events';
import { AngError } from '@atlasng/core';
import { Subject } from 'rxjs';

/**
 * Creates a source that emits whenever the view changes the value of a form control.
 *
 * Wraps `registerOnChange` of the control's value accessors, so only changes that the accessor reports from the
 * view emit; values set from code with `setValue` or a model binding do not. Every candidate accessor is wrapped
 * because the form control directive selects one later, when it sets up the control.
 *
 * @param control The form control directive on the host element, if any
 * @param accessors The value accessors provided on the host element, if any
 * @returns A source of view changes
 * @throws AngError when the host has no form control directive, or no value accessor.
 */
function watchViewChanges(
  control: NgControl | null,
  accessors: readonly ControlValueAccessor[] | null,
): TrackEventSource {
  if (!control) {
    throw new AngError(
      AnalyticsErrorCode.MissingFormControl,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        'angTrackControlChange requires a form control directive, such as ngModel or formControl, on the same element.',
    );
  }

  const candidates = new Set([...(accessors ?? []), ...(control.valueAccessor ? [control.valueAccessor] : [])]);
  if (candidates.size === 0) {
    throw new AngError(
      AnalyticsErrorCode.MissingValueAccessor,
      (typeof ngDevMode === 'undefined' || ngDevMode) &&
        'angTrackControlChange requires a form control with a ControlValueAccessor.',
    );
  }

  const changes = new Subject<void>();
  for (const accessor of candidates) {
    const registerOnChange = accessor.registerOnChange.bind(accessor);
    accessor.registerOnChange = (fn: (value: unknown) => void) =>
      registerOnChange((value: unknown) => {
        fn(value);
        changes.next();
      });
  }

  return changes;
}

/**
 * Tracks value changes that the user makes in a form control as {@link CoreEvents.Change} events.
 *
 * Apply it next to `ngModel`, `formControl`, or `formControlName` on a control with a `ControlValueAccessor`. Only changes
 * from the view are tracked; values set from code are ignored. Text inputs report every keystroke, so set a debounce for them.
 * The changed value is never sent.
 */
@Directive({
  selector: '[angTrackControlChange]',
  exportAs: 'angTrackControlChange',
})
export class TrackControlChange {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackControlChange`, transform: payloadAttribute<CoreEvents.Change> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackControlChangeOptions` });
  /** Delay in milliseconds to wait for a pause in changes before tracking. */
  readonly debounce = input(undefined, { alias: `angTrackControlChangeDebounce`, transform: debounceAttribute });
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackControlChangeDisabled`, transform: booleanAttribute });

  /** Initializes tracking of view changes for the form control on the host element. */
  constructor() {
    const changes = watchViewChanges(
      inject(NgControl, { self: true, optional: true }),
      inject(NG_VALUE_ACCESSOR, { self: true, optional: true }),
    );

    initializeTrackEvent({
      event: CoreEvents.Change,
      payload: this.payload,
      options: this.options,
      on: () => ({ valueChange: changes }),
      debounce: this.debounce,
      disabled: this.disabled,
    });
  }
}
