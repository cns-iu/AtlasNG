import { render, screen } from '@testing-library/angular';
import { AnyLinkCommand } from '@atlasng/common';
import { BasicProfileCard } from './basic-profile-card';

describe('BasicProfileCard', () => {
  type BasicProfileCardInputs = {
    image: string;
    name: string;
    description: string | string[];
    link?: AnyLinkCommand;
  };

  async function setup(inputs?: Partial<BasicProfileCardInputs>) {
    return await render(BasicProfileCard, {
      inputs: {
        image: '/profile.jpg',
        name: 'Jane Doe',
        description: 'Design leader and accessibility advocate.',
        ...inputs,
      },
    });
  }

  it('renders image, name, and single description without link by default', async () => {
    await setup();

    expect(screen.getByRole('img', { name: 'Profile picture of Jane Doe' })).toHaveAttribute('src', '/profile.jpg');
    expect(screen.getByText('Jane Doe')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Jane Doe' })).not.toBeInTheDocument();
    expect(screen.getByText('Design leader and accessibility advocate.')).toBeVisible();
  });

  it('renders the name as a link when link input is provided', async () => {
    await setup({ link: 'https://example.com/profiles/jane-doe' });

    const link = screen.getByRole('link', { name: 'Jane Doe' });
    expect(link).toHaveAttribute('href', 'https://example.com/profiles/jane-doe');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders all description lines when description is an array', async () => {
    await setup({
      description: ['Design leader', 'Accessibility advocate', 'Public speaker'],
    });

    expect(screen.getByText('Design leader')).toBeVisible();
    expect(screen.getByText('Accessibility advocate')).toBeVisible();
    expect(screen.getByText('Public speaker')).toBeVisible();
  });
});
