import { LOCATION } from '@atlasng/core';
import { ComponentInput, render, screen } from '@testing-library/angular';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  type SetupOptions = {
    currentUrl?: string;
    inputs?: ComponentInput<Breadcrumbs>;
  };

  function setup({ currentUrl = '/', inputs = {} }: SetupOptions = {}) {
    return render(Breadcrumbs, {
      inputs,
      providers: [{ provide: LOCATION, useValue: { href: currentUrl } }],
    });
  }

  it('renders separators between crumbs and supports a custom separator', async () => {
    await setup({
      inputs: {
        items: [{ name: 'One' }, { name: 'Two' }, { name: 'Three' }],
        separator: '>',
      },
    });

    const separators = screen.getAllByText('>');
    expect(separators).toHaveLength(2);
    expect(separators[0]).toHaveAttribute('aria-hidden', 'true');
    expect(separators[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('marks the active linked crumb as the current page', async () => {
    await setup({
      currentUrl: '/products',
      inputs: {
        items: [
          { name: 'Home', command: '/' },
          { name: 'Products', command: '/products' },
          { name: 'Current Page' },
        ],
      },
    });

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Current Page')).not.toHaveAttribute('aria-current');
  });
});
