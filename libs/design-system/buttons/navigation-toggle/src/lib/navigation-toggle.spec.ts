import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavigationToggle } from './navigation-toggle';

describe('NavigationToggle', () => {
  async function setup(link: string | null = null) {
    const user = userEvent.setup();
    const rendered = await render(`<ang-navigation-toggle>Category</ang-navigation-toggle>`, {
      imports: [NavigationToggle],
      componentProperties: {
        link,
      },
    });

    return {
      user,
      ...rendered,
    };
  }

  it('toggles state when clicked', async () => {
    const { user } = await setup();
    const toggle = screen.getByText('Category').closest('.ang-navigation-toggle--button');

    expect(toggle).toBeTruthy();

    const icon = toggle?.querySelector('.ang-navigation-toggle--icon');

    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_more');

    await user.click(toggle as Element);
    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_less');

    await user.click(toggle as Element);
    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_more');
  });

  it('reflects the selected state with aria-expanded', async () => {
    const { user } = await setup();
    const button = screen.getByRole('button', { name: 'Category' });

    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
