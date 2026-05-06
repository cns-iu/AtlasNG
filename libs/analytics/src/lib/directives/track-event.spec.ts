import { Type } from '@angular/core';
import { AnalyticsEvent, AnalyticsEventCategory, CoreEvents, createAnalyticsEvent } from '@atlasng/analytics/events';
import { fireEvent, render } from '@testing-library/angular';
import { EventType } from '@testing-library/dom';
import { provideAnalytics, withCustomBackend } from '../provider';
import { EventScope } from '../scope';
import {
  TrackBlur,
  TrackChange,
  TrackClick,
  TrackDoubleClick,
  TrackError,
  TrackEvent,
  TrackFocus,
  TrackHover,
  TrackInput,
  TrackKeyboard,
  TrackReset,
  TrackSubmit,
} from './track-event';

const rootScope = 'root-scope';
const componentScope = 'component-scope';
const defaultPayload: Record<string, unknown> | '' = { test: 'payload' };
const defaultOptions: Record<string, unknown> = { option: 'value' };

async function setupCommon(
  template: string,
  directive: Type<unknown>,
  event: AnalyticsEvent,
  trigger: string | string[],
  payload = defaultPayload,
  options = defaultOptions,
  disabled = false,
) {
  const backend = {
    page: vi.fn(),
    track: vi.fn(),
  };

  const result = await render(template, {
    imports: [EventScope, directive],
    providers: [
      provideAnalytics(
        { rootScope: rootScope },
        withCustomBackend(() => backend),
      ),
    ],
    componentProperties: {
      event,
      payload,
      options,
      trigger,
      disabled,
    },
  });

  const hostEl = result.container.querySelector(`#host`) as HTMLElement;

  return { ...result, hostEl, backend };
}

function buildTrackArgs(trigger: string, payload = defaultPayload, options = defaultOptions) {
  return [
    expect.any(String),
    {
      ...payload,
      path: `${rootScope}.${componentScope}`,
      trigger,
      triggerData: expect.any(Event),
    },
    options,
  ];
}

describe('TrackEvent', () => {
  const template = `<div
    id="host"
    angEventScope="${componentScope}"
    [angTrackEvent]="event"
    [angTrackEventPayload]="payload"
    [angTrackEventOptions]="options"
    [angTrackEventOn]="trigger"
    [angTrackEventDisabled]="disabled">
  </div>`;

  function setup(
    event = CoreEvents.Click,
    trigger: string | string[] = 'click',
    payload = defaultPayload,
    options = defaultOptions,
    disabled = false,
  ) {
    return setupCommon(template, TrackEvent, event, trigger, payload, options, disabled);
  }

  it('should trigger the specified event', async () => {
    const { backend, hostEl } = await setup();

    fireEvent.click(hostEl);
    expect(backend.track).toHaveBeenCalledWith(...buildTrackArgs('click'));
  });

  it('should not trigger when disabled', async () => {
    const { backend, hostEl } = await setup(undefined, undefined, undefined, undefined, true);

    fireEvent.click(hostEl);
    expect(backend.track).not.toHaveBeenCalled();
  });

  it('treats the empty string as an empty payload', async () => {
    const { backend, hostEl } = await setup(undefined, undefined, '');

    fireEvent.click(hostEl);
    expect(backend.track).toHaveBeenCalledWith(...buildTrackArgs('click', {}));
  });

  it('can trigger on custom analytics events', async () => {
    const customEvent = createAnalyticsEvent('customEvent', AnalyticsEventCategory.Statistics);
    const event = new Event('customTrigger');
    const { backend, hostEl } = await setup(customEvent, 'customTrigger');

    fireEvent(hostEl, event);
    expect(backend.track).toHaveBeenCalledWith(...buildTrackArgs('customTrigger'));
  });

  it('can have multiple triggers', async () => {
    const { backend, hostEl } = await setup(undefined, ['click', 'dblclick']);

    fireEvent.click(hostEl);
    fireEvent.dblClick(hostEl);
    expect(backend.track).toHaveBeenCalledTimes(2);
    expect(backend.track).toHaveBeenNthCalledWith(1, ...buildTrackArgs('click'));
    expect(backend.track).toHaveBeenNthCalledWith(2, ...buildTrackArgs('dblclick'));
  });
});

interface SpecializedTrackEventTestCase {
  name: string;
  selector: string;
  directive: Type<unknown>;
  event: EventType;
  modifiers?: { modifier: string; opts: Record<string, unknown> }[];
}

describe.for<SpecializedTrackEventTestCase>([
  { name: 'TrackBlur', directive: TrackBlur, selector: 'angTrackBlur', event: 'blur' },
  { name: 'TrackChange', directive: TrackChange, selector: 'angTrackChange', event: 'change' },
  { name: 'TrackClick', directive: TrackClick, selector: 'angTrackClick', event: 'click' },
  { name: 'TrackDoubleClick', directive: TrackDoubleClick, selector: 'angTrackDoubleClick', event: 'dblClick' },
  { name: 'TrackError', directive: TrackError, selector: 'angTrackError', event: 'error' },
  { name: 'TrackFocus', directive: TrackFocus, selector: 'angTrackFocus', event: 'focus' },
  { name: 'TrackHover', directive: TrackHover, selector: 'angTrackHover', event: 'mouseEnter' },
  { name: 'TrackInput', directive: TrackInput, selector: 'angTrackInput', event: 'input' },
  {
    name: 'TrackKeyboard',
    directive: TrackKeyboard,
    selector: 'angTrackKeyboard',
    event: 'keyDown',
    modifiers: [
      { modifier: 'enter', opts: { key: 'Enter' } },
      { modifier: 'alt.enter', opts: { key: 'Enter', altKey: true } },
    ],
  },
  { name: 'TrackReset', directive: TrackReset, selector: 'angTrackReset', event: 'reset' },
  { name: 'TrackSubmit', directive: TrackSubmit, selector: 'angTrackSubmit', event: 'submit' },
])('$name', ({ directive, selector, event, modifiers }) => {
  const template = `<div
    id="host"
    angEventScope="${componentScope}"
    [${selector}]="payload"
    [${selector}Options]="options"
    [${selector}On]="trigger"
    [${selector}Disabled]="disabled">
  </div>`;

  function setup(trigger = event.toLowerCase(), payload = defaultPayload, options = defaultOptions, disabled = false) {
    return setupCommon(template, directive, CoreEvents.Error, trigger, payload, options, disabled);
  }

  it(`should trigger on "${event}"`, async () => {
    const { backend, hostEl } = await setup();

    fireEvent[event](hostEl);
    expect(backend.track).toHaveBeenCalledWith(...buildTrackArgs(event.toLowerCase()));
  });

  it('should not trigger when disabled', async () => {
    const { backend, hostEl } = await setup(undefined, undefined, undefined, true);

    fireEvent[event](hostEl);
    expect(backend.track).not.toHaveBeenCalled();
  });

  it('treats the empty string as an empty payload', async () => {
    const { backend, hostEl } = await setup(undefined, '');

    fireEvent[event](hostEl);
    expect(backend.track).toHaveBeenCalledWith(...buildTrackArgs(event.toLowerCase(), {}));
  });

  describe.for(modifiers ?? [])('with modifier "%s"', ({ modifier, opts }) => {
    it('should only trigger on events matching the modifier', async () => {
      const trigger = `${event}.${modifier}`.toLowerCase();
      const { backend, hostEl } = await setup(trigger);

      fireEvent[event](hostEl);
      fireEvent[event](hostEl, opts);
      expect(backend.track).toHaveBeenCalledTimes(1);
      expect(backend.track).toHaveBeenCalledWith(...buildTrackArgs(trigger));
    });
  });
});
