import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { FakeMatIconRegistry } from '@angular/material/icon/testing';
import { AnyLink } from '@atlasng/common';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Footer, FooterAction, FooterLogo } from './footer';

const SOCIALS = ['linkedin', 'youtube', 'instagram'];

@Component({
  imports: [Footer],
  template: `
    <ang-footer
      [logoImage]="logoImage"
      [socials]="socials"
      [organization]="organization"
      [organizationLink]="organizationLink"
      (openPrivacyPolicy)="openPrivacyPolicy()"
      (openPrivacyPreferences)="openPrivacyPreferences()"
    />
  `,
})
class FooterHost {
  readonly logoImage = '/assets/wpp.svg';
  readonly socials = SOCIALS;
  readonly organization = 'Whole Person Physiome';
  readonly organizationLink = 'https://www.cns.edu';
  readonly openPrivacyPolicy = vi.fn();
  readonly openPrivacyPreferences = vi.fn();
}

@Component({
  imports: [AnyLink, Footer, FooterAction, FooterLogo],
  template: `
    <ang-footer
      [logoImage]="logoImage"
      [socials]="socials"
      [organization]="organization"
      [organizationLink]="organizationLink"
    >
      <a angFooterLogo target="_blank" [angAnyLink]="organizationLink">Projected logo</a>
      <a angFooterAction target="_blank" href="https://example.com/privacy">Projected privacy policy</a>
    </ang-footer>
  `,
})
class FooterProjectionHost {
  readonly logoImage = '/assets/wpp.svg';
  readonly socials = SOCIALS;
  readonly organization = 'Whole Person Physiome';
  readonly organizationLink = 'https://www.cns.edu';
}

describe('Footer', () => {
  function setup() {
    return render(FooterHost, {
      providers: [{ provide: MatIconRegistry, useClass: FakeMatIconRegistry }],
    });
  }

  it('exposes the footer as the contentinfo landmark', async () => {
    await setup();

    expect(screen.getByRole('contentinfo')).toHaveClass('ang-footer--container');
  });

  it('renders the logo image with the configured source', async () => {
    await setup();

    const logo = screen.getByRole('img', { name: 'Logo of Whole Person Physiome' });
    expect(logo).toHaveAttribute('src', '/assets/wpp.svg');
    expect(logo).toHaveClass('ang-footer--logo-image');
  });

  it('links the logo to the organization link', async () => {
    await setup();

    expect(screen.getByRole('link', { name: 'Logo of Whole Person Physiome' })).toHaveAttribute(
      'href',
      'https://www.cns.edu/',
    );
  });

  it('links the logo to the homepage when no organization link is set', async () => {
    await render(Footer, {
      inputs: { logoImage: '/assets/wpp.svg', organization: 'Whole Person Physiome' },
      providers: [{ provide: MatIconRegistry, useClass: FakeMatIconRegistry }],
    });

    expect(screen.getByRole('link', { name: 'Logo of Whole Person Physiome' })).toHaveAttribute('href', '/');
  });

  it('describes the logo link with a homepage tooltip', async () => {
    await setup();

    expect(screen.getByRole('link', { name: 'Logo of Whole Person Physiome' })).toHaveAccessibleDescription('Homepage');
  });

  it('renders social media buttons from the socials input', async () => {
    await setup();

    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'YouTube' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
  });

  it('exposes the social icon count to the styles', async () => {
    await setup();

    const icons = screen.getByRole('link', { name: 'LinkedIn' }).closest('.ang-footer--social-icons');
    expect(icons).toHaveStyle({ '--ang-footer--social-icon-count': '3' });
  });

  it('renders the privacy action buttons', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Privacy Preferences' })).toBeInTheDocument();
  });

  it('emits privacy action events when the buttons are clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();

    await user.click(screen.getByRole('button', { name: 'Privacy Policy' }));
    await user.click(screen.getByRole('button', { name: 'Privacy Preferences' }));

    expect(fixture.componentInstance.openPrivacyPolicy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.openPrivacyPreferences).toHaveBeenCalledOnce();
  });

  it('renders copyright text with the current year and organization', async () => {
    await setup();

    const year = new Date().getFullYear();
    expect(screen.getByText(`© ${year} Copyright Whole Person Physiome. All rights reserved.`)).toBeVisible();
  });

  it('renders projected logo and action content when provided', async () => {
    await render(FooterProjectionHost, {
      providers: [{ provide: MatIconRegistry, useClass: FakeMatIconRegistry }],
    });

    expect(screen.getByRole('link', { name: 'Projected logo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projected privacy policy' })).toBeInTheDocument();
  });
});
