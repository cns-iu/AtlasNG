import { render, screen } from '@testing-library/angular';
import { LastModified } from './last-modified';

describe('LastModified', () => {
  async function setup(inputs: { date?: Date | string | number | null; label?: string }) {
    return render(LastModified, { inputs });
  }

  it('renders an ISO date as "Last updated on Month D, YYYY"', async () => {
    await setup({ date: '2026-06-16' });

    expect(screen.getByRole('paragraph')).toHaveTextContent('Last updated on June 16, 2026');
  });

  it('marks up the date with a machine-readable datetime', async () => {
    await setup({ date: '2026-06-16' });

    expect(screen.getByText('June 16, 2026')).toHaveAttribute('datetime', '2026-06-16');
  });

  it('accepts ISO timestamps', async () => {
    await setup({ date: '2026-06-16T12:00:00Z' });

    expect(screen.getByText('June 16, 2026')).toBeInTheDocument();
  });

  it('accepts timestamps in milliseconds', async () => {
    await setup({ date: new Date(2026, 5, 16, 12).getTime() });

    expect(screen.getByText('June 16, 2026')).toBeInTheDocument();
  });

  it('accepts Date objects', async () => {
    await setup({ date: new Date(2026, 5, 16) });

    expect(screen.getByText('June 16, 2026')).toBeInTheDocument();
  });

  it('renders a custom label', async () => {
    await setup({ date: '2026-06-16', label: 'Last modified' });

    expect(screen.getByRole('paragraph')).toHaveTextContent('Last modified June 16, 2026');
  });

  it.each([undefined, null, '', '  ', 'not a date', Number.NaN, new Date(Number.NaN)])(
    'hides itself when the date is %j',
    async (date) => {
      const { fixture } = await setup({ date });

      expect(fixture.nativeElement).toHaveAttribute('hidden');
      expect(screen.queryByText(/Last updated on/)).not.toBeInTheDocument();
    },
  );

  it('shows itself once a parent sets the date', async () => {
    const { rerender } = await render('<ang-last-modified [date]="date" />', {
      imports: [LastModified],
      componentProperties: { date: undefined as string | undefined },
    });

    await rerender({ componentProperties: { date: '2026-06-16' } });

    expect(screen.getByText('June 16, 2026')).toBeVisible();
  });
});
