import { Component } from '@angular/core';
import { AnyLink } from '@atlasng/common';
import { MatIconRegistry } from '@angular/material/icon';
import { FakeMatIconRegistry } from '@angular/material/icon/testing';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { type SocialMediaButtonDefinition } from '@atlasng/design-system/buttons/social-media-button';
import { Footer, FooterAction, FooterLogo } from './footer';

const SOCIALS: SocialMediaButtonDefinition[] = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/',
    classes: ['linkedin'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/',
    classes: ['youtube'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/',
    classes: ['instagram'],
  },
];

@Component({
  imports: [Footer],
  template: `
    <ang-footer
      [logoUrl]="logoUrl"
      [logoAlt]="logoAlt"
      [socials]="socials"
      [org]="org"
      [orgLink]="orgLink"
      (openPrivacyPolicy)="openPrivacyPolicy()"
      (openPrivacyPreferences)="openPrivacyPreferences()"
    />
  `,
})
class FooterHost {
  readonly logoUrl = '/assets/wpp.svg';
  readonly logoAlt = 'App Logo';
  readonly socials = SOCIALS;
  readonly org = 'Whole Person Physiome';
  readonly orgLink = 'https://www.cns.edu';
  readonly openPrivacyPolicy = vi.fn();
  readonly openPrivacyPreferences = vi.fn();
}

@Component({
  imports: [AnyLink, Footer, FooterAction, FooterLogo],
  template: `
    <ang-footer [logoUrl]="logoUrl" [logoAlt]="logoAlt" [socials]="socials" [org]="org" [orgLink]="orgLink">
      <a angFooterLogo target="_blank" [angAnyLink]="orgLink">Projected logo</a>
      <a angFooterAction target="_blank" href="https://example.com/privacy">Projected privacy policy</a>
    </ang-footer>
  `,
})
class FooterProjectionHost {
  readonly logoUrl = '/assets/wpp.svg';
  readonly logoAlt = 'App Logo';
  readonly socials = SOCIALS;
  readonly org = 'Whole Person Physiome';
  readonly orgLink = 'https://www.cns.edu';
}

describe('Footer', () => {
  function setup() {
    return render(FooterHost, {
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

  it('emits privacy action events when the buttons are clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await setup();

    await user.click(screen.getByRole('button', { name: 'Privacy Policy' }));
    await user.click(screen.getByRole('button', { name: 'Privacy Preferences' }));

    expect(fixture.componentInstance.openPrivacyPolicy).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.openPrivacyPreferences).toHaveBeenCalledOnce();
  });

  it('renders copyright text with current year and organization link', async () => {
    await setup();

    const orgLink = screen.getByRole('link', { name: 'Whole Person Physiome' });
    expect(orgLink).toHaveAttribute('href', 'https://www.cns.edu/');

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
  });

  it('renders projected logo and action content when provided', async () => {
    await render(FooterProjectionHost, {
      providers: [{ provide: MatIconRegistry, useClass: FakeMatIconRegistry }],
    });

    expect(screen.getByRole('link', { name: 'Projected logo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projected privacy policy' })).toBeInTheDocument();
  });
});
