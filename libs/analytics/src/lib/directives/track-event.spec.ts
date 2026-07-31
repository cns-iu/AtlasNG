import { AnalyticsEvent, AnalyticsEventCategory, CoreEvents, createAnalyticsEvent } from '@atlasng/analytics/events';
import { fireEvent, render } from '@testing-library/angular';
import { provideAnalytics, withCustomBackend } from '../provider';
import { EventScope } from '../scope';
import { AnalyticsEventTrackingDef, MultiTrackEvent, TrackEvent } from './track-event';

const rootScope = 'root-scope';
const componentScope = 'component-scope';
const defaultPayload: Record<string, unknown> = { test: 'payload' };
const defaultOptions: Record<string, unknown> = { option: 'value' };

describe('TrackEvent', () => {
  const template = `<div
    data-testid="host"
    angEventScope="${componentScope}"
    [angTrackEvent]="event"
    [angTrackEventPayload]="payload"
    [angTrackEventOptions]="options"
    [angTrackEventOn]="trigger"
    [angTrackEventDisabled]="disabled">
  </div>`;

  async function setup(
    event = CoreEvents.Click,
    trigger: string | string[] = 'click',
    payload: Record<string, unknown> | '' = defaultPayload,
    options = defaultOptions,
    disabled = false,
  ) {
    const backend = {
      page: vi.fn(),
      track: vi.fn(),
    };

    const result = await render(template, {
      imports: [EventScope, TrackEvent],
      providers: [
        provideAnalytics(
          { rootScope },
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

describe('MultiTrackEvent', () => {
  const template = `<div
    data-testid="host"
    angEventScope="${componentScope}"
    [angMultiTrackEvent]="defs"
    [angMultiTrackEventDisabled]="disabled">
  </div>`;
  const event1 = createAnalyticsEvent('event1', AnalyticsEventCategory.Statistics);
  const event2 = createAnalyticsEvent('event2', AnalyticsEventCategory.Marketing);

  async function setup(defs: AnalyticsEventTrackingDef<AnalyticsEvent>[] = [], disabled = false) {
    const backend = {
      page: vi.fn(),
      track: vi.fn(),
    };

    const result = await render(template, {
      imports: [EventScope, MultiTrackEvent],
      providers: [
        provideAnalytics(
          { rootScope },
          withCustomBackend(() => backend),
        ),
      ],
      componentProperties: {
        defs,
        disabled,
      },
    });

    return { ...result, hostEl: result.getByTestId('host'), backend };
  }

  function createDef(
    event: AnalyticsEvent,
    trigger: string,
    payload = defaultPayload,
    options = defaultOptions,
  ): AnalyticsEventTrackingDef<AnalyticsEvent> {
    return { event, trigger, payload, options };
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

  it('should track multiple events with correct payload and options', async () => {
    const defs = [createDef(event1, 'click'), createDef(event2, 'dblclick')];
    const { backend, hostEl } = await setup(defs);

    fireEvent.click(hostEl);
    fireEvent.dblClick(hostEl);

    expect(backend.track).toHaveBeenCalledTimes(2);
    expect(backend.track).toHaveBeenNthCalledWith(1, ...buildTrackArgs('click'));
    expect(backend.track).toHaveBeenNthCalledWith(2, ...buildTrackArgs('dblclick'));
  });

  it('should not track events when disabled', async () => {
    const defs = [createDef(event1, 'click')];
    const { backend, hostEl } = await setup(defs, true);

    fireEvent.click(hostEl);

    expect(backend.track).not.toHaveBeenCalled();
  });

  it('can trigger multiple events with the same trigger', async () => {
    const defs = [createDef(event1, 'click'), createDef(event2, 'click')];
    const { backend, hostEl } = await setup(defs);

    fireEvent.click(hostEl);

    expect(backend.track).toHaveBeenCalledTimes(2);
    expect(backend.track).toHaveBeenNthCalledWith(1, ...buildTrackArgs('click'));
    expect(backend.track).toHaveBeenNthCalledWith(2, ...buildTrackArgs('click'));
  });
});
