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
  it('renders the tagline and projected body content', async () => {
    await render('<ang-notice tagline="Notice">This page was recently updated.</ang-notice>', {
      imports: [Notice],
    });

    expect(screen.getByText('Notice')).toBeVisible();
    expect(screen.getByText('This page was recently updated.')).toBeVisible();
  });

  it('omits the tagline when none is provided', async () => {
    const tagline = signal<string | undefined>('Notice');
    const { fixture } = await render('<ang-notice [tagline]="tagline()">Body text</ang-notice>', {
      imports: [Notice],
      componentProperties: { tagline },
    });

    expect(screen.getByText('Notice')).toBeInTheDocument();

    tagline.set(undefined);
    fixture.detectChanges();

    expect(screen.queryByText('Notice')).not.toBeInTheDocument();
    expect(screen.getByText('Body text')).toBeVisible();
  });

  it('renders the tagline as a heading when a level is set', async () => {
    await render('<ang-notice tagline="Before you begin" [level]="3">Body text</ang-notice>', {
      imports: [Notice],
    });

    expect(screen.getByRole('heading', { level: 3, name: 'Before you begin' })).toBeVisible();
  });

  it('defaults to the info variant', async () => {
    const { fixture } = await render(Notice);

    expect(fixture.nativeElement).toHaveClass('ang-notice', 'ang-notice--variant-info');
  });

  it.each(VARIANTS)('applies the %s variant class and labeled icon', async (variant, icon, label) => {
    const { fixture } = await render(Notice, { inputs: { variant } });

    expect(fixture.nativeElement).toHaveClass('ang-notice', `ang-notice--variant-${variant}`);
    expect(screen.getByRole('img', { name: label })).toHaveAttribute('data-mat-icon-name', icon);
  });

  it('does not announce itself or add to the document outline', async () => {
    await render('<ang-notice variant="critical" tagline="Notice">Body text</ang-notice>', {
      imports: [Notice],
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('keeps projected links reachable by keyboard', async () => {
    const user = userEvent.setup();
    await render('<ang-notice tagline="Notice">See the <a href="/changelog">changelog</a>.</ang-notice>', {
      imports: [Notice],
    });

    await user.tab();

    expect(screen.getByRole('link', { name: 'changelog' })).toHaveFocus();
  });
});
