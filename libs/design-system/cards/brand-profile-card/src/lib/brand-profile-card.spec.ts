import { Component, input } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { BrandProfileCard, BrandProfileCardAction } from './brand-profile-card';

@Component({
  imports: [BrandProfileCard, BrandProfileCardAction],
  template: `
    <ang-brand-profile-card
      data-testid="brand-profile-card"
      image="/profile.jpg"
      name="Jane Doe"
      description="Design leader and accessibility advocate."
      [centered]="centered()"
    >
      <a angBrandProfileCardAction href="/profiles/jane-doe">View profile</a>
    </ang-brand-profile-card>
  `,
})
class BrandProfileCardHost {
  readonly centered = input(false);
}

describe('BrandProfileCard', () => {
  function setup() {
    return render(BrandProfileCardHost);
  }

  it('renders the profile image, name, and description', async () => {
    await setup();

    expect(screen.getByRole('img', { name: 'Profile picture of Jane Doe' })).toHaveAttribute('src', '/profile.jpg');
    expect(screen.getByText('Jane Doe')).toBeVisible();
    expect(screen.getByText('Design leader and accessibility advocate.')).toBeVisible();
  });

  it('centers the card when centered is enabled', async () => {
    const { rerender } = await setup();
    const card = screen.getByTestId('brand-profile-card');

    expect(card).not.toHaveClass('ang-brand-profile-card--centered');

    await rerender({ inputs: { centered: true }, partialUpdate: true });

    expect(card).toHaveClass('ang-brand-profile-card--centered');
  });

  it('projects marked actions into the action area', async () => {
    await setup();

    const action = screen.getByRole('link', { name: 'View profile' });
    expect(action).toHaveAttribute('href', '/profiles/jane-doe');
    expect(action).toHaveClass('ang-brand-profile-card--action');
  });
});
