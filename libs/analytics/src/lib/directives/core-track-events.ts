import { booleanAttribute, Directive, input } from '@angular/core';
import { AnalyticsEventPayloadFor, CoreEvents } from '@atlasng/analytics/events';
import { debounceAttribute, payloadAttribute, triggersAttribute } from './track-event-transforms';
import {
  initializeTrackEvent,
  TrackEventTriggers,
  TrackEventTriggersInput,
} from './track-event/initialize-track-event';

/** Specialized directive for tracking a blur event. */
@Directive({
  selector: '[angTrackBlur]',
  exportAs: 'angTrackBlur',
})
export class TrackBlur {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackBlur`, transform: payloadAttribute<CoreEvents.Blur> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackBlurOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { blur: true },
    {
      alias: `angTrackBlurOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackBlurDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Blur,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a change event. */
@Directive({
  selector: '[angTrackChange]',
  exportAs: 'angTrackChange',
})
export class TrackChange {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackChange`, transform: payloadAttribute<CoreEvents.Change> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackChangeOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { change: true },
    {
      alias: `angTrackChangeOn`,
      transform: triggersAttribute,
    },
  );
  /** Delay in milliseconds that each trigger waits for a pause before tracking. */
  readonly debounce = input(undefined, { alias: `angTrackChangeDebounce`, transform: debounceAttribute });
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackChangeDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Change,
      payload: this.payload,
      options: this.options,
      on: this.on,
      debounce: this.debounce,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a click event. */
@Directive({
  selector: '[angTrackClick]',
  exportAs: 'angTrackClick',
})
export class TrackClick {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackClick`, transform: payloadAttribute<CoreEvents.Click> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackClickOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { click: true },
    {
      alias: `angTrackClickOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackClickDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Click,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a double-click event. */
@Directive({
  selector: '[angTrackDoubleClick]',
  exportAs: 'angTrackDoubleClick',
})
export class TrackDoubleClick {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackDoubleClick`, transform: payloadAttribute<CoreEvents.DoubleClick> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackDoubleClickOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { dblclick: true },
    {
      alias: `angTrackDoubleClickOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackDoubleClickDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.DoubleClick,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking an error event. */
@Directive({
  selector: '[angTrackError]',
  exportAs: 'angTrackError',
})
export class TrackError {
  /** The payload to log with the analytics event. */
  readonly payload = input.required<AnalyticsEventPayloadFor<CoreEvents.Error>>({ alias: `angTrackError` });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackErrorOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { error: true },
    {
      alias: `angTrackErrorOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackErrorDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Error,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a focus event. */
@Directive({
  selector: '[angTrackFocus]',
  exportAs: 'angTrackFocus',
})
export class TrackFocus {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackFocus`, transform: payloadAttribute<CoreEvents.Focus> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackFocusOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { focus: true },
    {
      alias: `angTrackFocusOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackFocusDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Focus,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a hover event. */
@Directive({
  selector: '[angTrackHover]',
  exportAs: 'angTrackHover',
})
export class TrackHover {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackHover`, transform: payloadAttribute<CoreEvents.Hover> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackHoverOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { mouseenter: true },
    {
      alias: `angTrackHoverOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackHoverDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Hover,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking an input event. */
@Directive({
  selector: '[angTrackInput]',
  exportAs: 'angTrackInput',
})
export class TrackInput {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackInput`, transform: payloadAttribute<CoreEvents.Input> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackInputOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { input: true },
    {
      alias: `angTrackInputOn`,
      transform: triggersAttribute,
    },
  );
  /** Delay in milliseconds that each trigger waits for a pause before tracking. */
  readonly debounce = input(undefined, { alias: `angTrackInputDebounce`, transform: debounceAttribute });
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackInputDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Input,
      payload: this.payload,
      options: this.options,
      on: this.on,
      debounce: this.debounce,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a keyboard event. */
@Directive({
  selector: '[angTrackKeyboard]',
  exportAs: 'angTrackKeyboard',
})
export class TrackKeyboard {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackKeyboard`, transform: payloadAttribute<CoreEvents.Keyboard> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackKeyboardOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { keydown: true },
    {
      alias: `angTrackKeyboardOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackKeyboardDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Keyboard,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a reset event. */
@Directive({
  selector: '[angTrackReset]',
  exportAs: 'angTrackReset',
})
export class TrackReset {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackReset`, transform: payloadAttribute<CoreEvents.Reset> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackResetOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { reset: true },
    {
      alias: `angTrackResetOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackResetDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Reset,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}

/** Specialized directive for tracking a submit event. */
@Directive({
  selector: '[angTrackSubmit]',
  exportAs: 'angTrackSubmit',
})
export class TrackSubmit {
  /** The payload to log with the analytics event. */
  readonly payload = input({}, { alias: `angTrackSubmit`, transform: payloadAttribute<CoreEvents.Submit> });
  /** Additional options to pass to the analytics backend. */
  readonly options = input<Record<string, unknown>>(undefined, { alias: `angTrackSubmitOptions` });
  /** The DOM events or sources that should trigger the analytics event to be logged. */
  readonly on = input<TrackEventTriggers, TrackEventTriggersInput>(
    { submit: true },
    {
      alias: `angTrackSubmitOn`,
      transform: triggersAttribute,
    },
  );
  /** A flag indicating whether the directive is disabled. */
  readonly disabled = input(false, { alias: `angTrackSubmitDisabled`, transform: booleanAttribute });

  /** Initializes event tracking for the directive inputs. */
  constructor() {
    initializeTrackEvent({
      event: CoreEvents.Submit,
      payload: this.payload,
      options: this.options,
      on: this.on,
      disabled: this.disabled,
    });
  }
}
