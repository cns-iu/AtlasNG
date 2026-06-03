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

  it('renders projected text before the icon', async () => {
    await setup();

    const toggle = screen.getByText('Category').closest('.ang-navigation-category-toggle-button');

    expect(toggle).toBeTruthy();

    const text = toggle?.querySelector('.ang-navigation-category-toggle-text');
    const icon = toggle?.querySelector('.ang-navigation-category-toggle-icon');

    expect(text).toBeTruthy();
    expect(icon).toBeTruthy();

    if (!text || !icon) {
      throw new Error('Expected text and icon elements to exist');
    }

    expect(text.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

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

    const toggle = screen.getByText('Category').closest('.ang-navigation-category-toggle-button');

    expect(toggle).toBeTruthy();
    expect(toggle).toHaveAttribute('href');
    expect(toggle?.getAttribute('href')).toContain('/products');
    expect(toggle?.querySelector('.ang-navigation-category-toggle-icon')).not.toBeInTheDocument();
  });
});
