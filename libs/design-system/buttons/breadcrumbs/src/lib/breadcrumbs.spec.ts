import { ComponentInput, render, screen } from '@testing-library/angular';
import { Breadcrumbs } from './breadcrumbs';

describe('Breadcrumbs', () => {
  type SetupOptions = {
    inputs?: ComponentInput<Breadcrumbs>;
  };

  function setup({ inputs = {} }: SetupOptions = {}) {
    return render(Breadcrumbs, {
      inputs,
    });
  }

  it('renders a breadcrumb navigation landmark', async () => {
    await setup();

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('renders linked and non-linked crumb labels and marks only the last crumb as current page', async () => {
    await setup({
      inputs: {
        items: [{ name: 'Home', command: '/home' }, { name: 'Products', command: '/products' }, { name: 'Laptops' }],
      },
    });

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Laptops' })).not.toBeInTheDocument();
    expect(screen.getByText('Laptops')).toBeInTheDocument();

    const crumbs = screen.getAllByRole('listitem');
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0]).not.toHaveAttribute('aria-current');
    expect(crumbs[1]).not.toHaveAttribute('aria-current');
    expect(crumbs[2]).toHaveAttribute('aria-current', 'page');
  });

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

  it('renders no crumb items when input is empty', async () => {
    await setup({
      inputs: {
        items: [],
      },
    });

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
