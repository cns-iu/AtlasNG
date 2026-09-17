import { FocusMonitor } from '@angular/cdk/a11y';
import { render, screen } from '@testing-library/angular';
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
    const user = userEvent.setup();
    const result = await render(template, {
      imports: [HeaderSortTrigger],
      componentProperties: { sortFn },
      providers: [
        {
          provide: FocusMonitor,
          useValue: { monitor, stopMonitoring },
        },
      ],
    });

    return { ...result, monitor, sortFn, stopMonitoring, user };
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
