import { MatIconRegistry } from '@angular/material/icon';
import { FakeMatIconRegistry } from '@angular/material/icon/testing';
import { ComponentInput, render, screen } from '@testing-library/angular';
import { Footer } from './footer';

describe('Footer', () => {
  type SetupOptions = {
    inputs?: ComponentInput<Footer>;
  };

  function setup({ inputs = {} }: SetupOptions = {}) {
    return render(Footer, {
      inputs: {
        logoUrl: '/assets/wpp.svg',
        logoAlt: 'App Logo',
        socials: ['linkedin', 'youtube', 'instagram'],
        orgName: 'Whole Person Physiome',
        orgLink: 'https://www.cns.edu',
        ...inputs,
      },
      providers: [{ provide: MatIconRegistry, useClass: FakeMatIconRegistry }],
    });
  }

  it('renders the logo image with the configured source', async () => {
    await setup();

    const logo = screen.getByRole('img', { name: 'App Logo' });
    expect(logo).toHaveAttribute('src', '/assets/wpp.svg');
  });

  it('renders social media buttons from the socials input', async () => {
    await setup();

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YouTube' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
  });

  it('renders the privacy action buttons', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Privacy Preferences' })).toBeInTheDocument();
  });

  it('renders copyright text with current year and organization link', async () => {
    await setup();

    const orgLink = screen.getByRole('link', { name: 'Whole Person Physiome' });
    expect(orgLink).toHaveAttribute('href', 'https://www.cns.edu/');

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });
});
