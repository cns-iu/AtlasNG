import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Notice, NoticeVariant } from './notice';

const VARIANTS: [NoticeVariant, string, string][] = [
  ['info', 'info', 'Info'],
  ['success', 'check_circle', 'Success'],
  ['warning', 'warning', 'Warning'],
  ['critical', 'dangerous', 'Critical'],
  ['unavailable', 'warning', 'Unavailable'],
];

describe('Notice', () => {
  it('renders the heading and projected body content', async () => {
    await render('<ang-notice heading="Notice">This page was recently updated.</ang-notice>', {
      imports: [Notice],
    });

    expect(screen.getByText('Notice')).toBeVisible();
    expect(screen.getByText('This page was recently updated.')).toBeVisible();
  });

  it('omits the heading when none is provided', async () => {
    const heading = signal<string | undefined>('Notice');
    const { fixture } = await render('<ang-notice [heading]="heading()">Body text</ang-notice>', {
      imports: [Notice],
      componentProperties: { heading },
    });

    expect(screen.getByText('Notice')).toBeInTheDocument();

    heading.set(undefined);
    fixture.detectChanges();

    expect(screen.queryByText('Notice')).not.toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeVisible();
  });

  it('defaults to the info variant', async () => {
    const { fixture } = await render(Notice);

    expect(fixture.nativeElement).toHaveClass('ang-notice', 'ang-notice--variant-info');
  });

  it.each(VARIANTS)('applies the %s variant class, icon, and label', async (variant, icon, label) => {
    const { fixture } = await render(Notice, { inputs: { variant } });

    expect(fixture.nativeElement).toHaveClass('ang-notice', `ang-notice--variant-${variant}`);
    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('data-mat-icon-name', icon);
    expect(screen.getByText(`${label}:`)).toBeInTheDocument();
  });

  it('uses a custom screen-reader label when provided', async () => {
    await render(Notice, { inputs: { variant: 'warning', variantLabel: 'Heads up' } });

    expect(screen.getByText('Heads up:')).toBeInTheDocument();
    expect(screen.queryByText('Warning:')).not.toBeInTheDocument();
  });

  it('hides the decorative icon from assistive technology', async () => {
    await render(Notice);

    expect(screen.getByRole('img', { hidden: true })).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not announce itself or add to the document outline', async () => {
    await render('<ang-notice variant="critical" heading="Notice">Body text</ang-notice>', {
      imports: [Notice],
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('keeps projected links reachable by keyboard', async () => {
    const user = userEvent.setup();
    await render('<ang-notice heading="Notice">See the <a href="/changelog">changelog</a>.</ang-notice>', {
      imports: [Notice],
    });

    await user.tab();

    expect(screen.getByRole('link', { name: 'changelog' })).toHaveFocus();
  });
});
