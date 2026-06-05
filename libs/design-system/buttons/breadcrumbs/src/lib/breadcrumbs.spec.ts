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
});
