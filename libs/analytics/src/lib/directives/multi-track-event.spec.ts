import { AnalyticsEvent, AnalyticsEventCategory, createAnalyticsEvent } from '@atlasng/analytics/events';
import { fireEvent, render } from '@testing-library/angular';
import { provideAnalytics, withCustomBackend } from '../provider';
import { EventScope } from '../scope';
import { AnalyticsEventTrackingDef, MultiTrackEvent } from './multi-track-event';

describe('MultiTrackEvent', () => {
  const rootScope = 'root-scope';
  const componentScope = 'component-scope';
  const template = `<div
    id="host"
    angEventScope="${componentScope}"
    [angMultiTrackEvent]="defs"
    [angMultiTrackEventDisabled]="disabled">
  </div>`;
  const event1 = createAnalyticsEvent('event1', AnalyticsEventCategory.Statistics);
  const event2 = createAnalyticsEvent('event2', AnalyticsEventCategory.Marketing);
  const defaultPayload: Record<string, unknown> = { test: 'payload' };
  const defaultOptions: Record<string, unknown> = { option: 'value' };

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

    const hostEl = result.container.querySelector(`#host`) as HTMLElement;

    return { ...result, hostEl, backend };
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
