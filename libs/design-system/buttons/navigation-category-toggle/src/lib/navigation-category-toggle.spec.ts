import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavigationCategoryToggle } from './navigation-category-toggle';

describe('NavigationCategoryToggle', () => {
  async function setup(link: string | null = null) {
    const user = userEvent.setup();
    const rendered = await render(
      `<ang-navigation-category-toggle [link]="link">Category</ang-navigation-category-toggle>`,
      {
        imports: [NavigationCategoryToggle],
        componentProperties: {
          link,
        },
      },
    );

    return {
      user,
      ...rendered,
    };
  }

  it('toggles state when clicked', async () => {
    const { user } = await setup();
    const toggle = screen.getByText('Category').closest('.ang-navigation-category-toggle-button');

    expect(toggle).toBeTruthy();

    const icon = toggle?.querySelector('.ang-navigation-category-toggle-icon');

    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_more');

    await user.click(toggle as Element);
    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_less');

    await user.click(toggle as Element);
    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_more');
  });

  it('hides the toggle icon when a link is provided', async () => {
    await setup('/products');

    const toggle = screen.getByRole('button', { name: 'Category' });

    expect(toggle).toBeTruthy();
    expect(toggle).toHaveAttribute('tabindex', '0');
    expect(toggle).not.toHaveAttribute('href');
    expect(toggle.querySelector('.ang-navigation-category-toggle-icon')).not.toBeInTheDocument();
  });
});
