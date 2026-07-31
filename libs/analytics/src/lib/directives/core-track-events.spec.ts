import { Type } from '@angular/core';
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
  TrackFocus,
  TrackHover,
  TrackInput,
  TrackKeyboard,
  TrackReset,
  TrackSubmit,
} from './core-track-events';

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
  const rootScope = 'root-scope';
  const componentScope = 'component-scope';
  const defaultPayload: Record<string, unknown> | '' = { test: 'payload' };
  const defaultOptions: Record<string, unknown> = { option: 'value' };
  const template = `<div
    data-testid="host"
    angEventScope="${componentScope}"
    [${selector}]="payload"
    [${selector}Options]="options"
    [${selector}On]="trigger"
    [${selector}Disabled]="disabled">
  </div>`;

  async function setup(
    trigger = event.toLowerCase(),
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
          { rootScope },
          withCustomBackend(() => backend),
        ),
      ],
      componentProperties: {
        payload,
        options,
        trigger,
        disabled,
      },
    });

    return { ...result, hostEl: result.getByTestId('host'), backend };
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
