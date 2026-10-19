import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NavigationToggle } from './navigation-toggle';

describe('NavigationToggle', () => {
  async function setup() {
    const user = userEvent.setup();
    const rendered = await render(`<ang-navigation-toggle>Category</ang-navigation-toggle>`, {
      imports: [NavigationToggle],
    });

    return {
      user,
      ...rendered,
    };
  }

  it('toggles the expand icon when clicked', async () => {
    const { user } = await setup();
    const button = screen.getByRole('button', { name: 'Category' });
    const icon = within(button).getByRole('img', { hidden: true });

    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_more');

    await user.click(button);
    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_less');

    await user.click(button);
    expect(icon).toHaveAttribute('data-mat-icon-name', 'expand_more');
  });

  it('reflects the selected state with aria-expanded', async () => {
    const { user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Category', expanded: false }));
    expect(screen.getByRole('button', { name: 'Category', expanded: true })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Category', expanded: false })).toBeInTheDocument();
  });
});
