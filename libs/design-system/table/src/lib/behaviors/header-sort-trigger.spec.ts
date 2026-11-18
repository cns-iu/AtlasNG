import { FocusMonitor } from '@angular/cdk/a11y';
import { Analytics } from '@atlasng/analytics';
import { CoreEvents } from '@atlasng/analytics/events';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HeaderSortTrigger } from './header-sort-trigger';

describe('HeaderSortTrigger', () => {
  async function setup(
    template = `
      <div class="datatable-header-cell sortable" role="button" tabindex="0">
        <span [angHeaderSortTrigger]="sortFn">Sort</span>
      </div>
    `,
  ) {
    const monitor = vi.fn();
    const stopMonitoring = vi.fn();
    const sortFn = vi.fn();
    const trackEvent = vi.fn((_event: unknown, _payload: { path?: string; trigger?: string }) => Promise.resolve());
    const user = userEvent.setup();
    const result = await render(template, {
      imports: [HeaderSortTrigger],
      componentProperties: { sortFn },
      providers: [
        {
          provide: FocusMonitor,
          useValue: { monitor, stopMonitoring },
        },
        { provide: Analytics, useValue: { trackEvent } },
      ],
    });

    return { ...result, monitor, sortFn, stopMonitoring, trackEvent, user };
  }

  it('applies its host class and monitors the containing sortable header', async () => {
    const { monitor } = await setup();
    const header = screen.getByRole('button', { name: 'Sort' });

    expect(screen.getByText('Sort')).toHaveClass('ang-table--header-sort-trigger');
    expect(monitor).toHaveBeenCalledOnce();
    expect(monitor).toHaveBeenCalledWith(header, true);
  });

  it('invokes the sort callback when the header is clicked or activated with Space', async () => {
    const { sortFn, user } = await setup();
    const header = screen.getByRole('button', { name: 'Sort' });

    await user.click(header);
    expect(sortFn).toHaveBeenCalledOnce();

    sortFn.mockClear();
    header.focus();
    await user.keyboard(' ');
    expect(sortFn).toHaveBeenCalledOnce();
  });

  it('tracks clicks, Space, and Enter activations in the sort scope', async () => {
    const { sortFn, trackEvent, user } = await setup();
    const header = screen.getByRole('button', { name: 'Sort' });

    await user.click(header);
    header.focus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');

    expect(sortFn).toHaveBeenCalledTimes(2);
    expect(trackEvent.mock.calls.map(([event, payload]) => [event, payload.trigger, payload.path])).toEqual([
      [CoreEvents.Click, 'click', 'sort'],
      [CoreEvents.Click, 'keydown', 'sort'],
      [CoreEvents.Click, 'keydown', 'sort'],
    ]);
  });

  it('prevents the default page scroll when activated with Space', async () => {
    await setup();
    const header = screen.getByRole('button', { name: 'Sort' });

    expect(fireEvent.keyDown(header, { key: ' ' })).toBe(false);
  });

  it('does not attach behavior without a containing sortable header', async () => {
    const { monitor, sortFn, user } = await setup(`<span [angHeaderSortTrigger]="sortFn">Sort</span>`);

    await user.click(screen.getByText('Sort'));

    expect(monitor).not.toHaveBeenCalled();
    expect(sortFn).not.toHaveBeenCalled();
  });

  it('stops monitoring focus and removes activation listeners when destroyed', async () => {
    const { fixture, sortFn, stopMonitoring, user } = await setup();
    const header = screen.getByRole('button', { name: 'Sort' });

    fixture.destroy();
    await user.click(header);

    expect(stopMonitoring).toHaveBeenCalledOnce();
    expect(stopMonitoring).toHaveBeenCalledWith(header);
    expect(sortFn).not.toHaveBeenCalled();
  });
});
