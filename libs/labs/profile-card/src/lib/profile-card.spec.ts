import { ComponentInput, render, screen } from '@testing-library/angular';
import { ProfileCard } from './profile-card';

describe('ProfileCard', () => {
  type SetupOptions = {
    inputs?: ComponentInput<ProfileCard>;
    content?: string;
  };

  function setup({ inputs = {}, content = '<a href="/profile">View profile</a>' }: SetupOptions = {}) {
    return render(
      `<ang-profile-card
				[pictureUrl]="pictureUrl"
				[name]="name"
				[description]="description"
				[centerContent]="centerContent"
			>
				${content}
			</ang-profile-card>`,
      {
        imports: [ProfileCard],
        componentProperties: {
          pictureUrl: '/assets/profile.png',
          name: 'Ada Lovelace',
          description: 'Mathematician',
          centerContent: false,
          ...inputs,
        },
      },
    );
  }

  it('renders the name and description text', async () => {
    await setup();

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Mathematician')).toBeInTheDocument();
  });

  it('renders the profile picture with src and accessible alt text', async () => {
    await setup();

    const image = screen.getByRole('img', { name: 'Profile picture of Ada Lovelace' });

    expect(image).toHaveAttribute('src', '/assets/profile.png');
  });

  it('renders projected action content', async () => {
    await setup({ content: '<button type="button">Connect</button>' });

    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('applies the center-content host class when centerContent is true', async () => {
    const { container } = await setup({ inputs: { centerContent: true } });

    expect(container.querySelector('ang-profile-card')).toHaveClass('ang-profile-card-center-content');
  });

  it('does not apply the center-content host class by default', async () => {
    const { container } = await setup();

    expect(container.querySelector('ang-profile-card')).not.toHaveClass('ang-profile-card-center-content');
  });
});
