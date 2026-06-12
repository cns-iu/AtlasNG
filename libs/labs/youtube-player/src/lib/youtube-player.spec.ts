import { ComponentInput, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { YoutubePlayer } from './youtube-player';

describe('YoutubePlayer', () => {
  type SetupOptions = {
    inputs?: ComponentInput<YoutubePlayer>;
    on?: {
      enableCookies?: () => void;
    };
  };

  async function setup({ inputs = {}, on = {} }: SetupOptions = {}) {
    const user = userEvent.setup();

    await render(YoutubePlayer, {
      inputs: {
        videoId: 'pzUFmDhQEO8',
        label: 'Example video',
        ...inputs,
      },
      on,
    });

    return {
      user,
    };
  }

  it('renders a thumbnail link when cookies are disabled', async () => {
    await setup();

    const thumbnailLink = screen.getByRole('link', { name: /YouTube video thumbnail for Example video/i });
    const image = screen.getByRole('img', { name: /YouTube video thumbnail for Example video/i });

    expect(thumbnailLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=pzUFmDhQEO8');
    expect(thumbnailLink).toHaveAttribute('target', '_blank');
    expect(thumbnailLink).toHaveAttribute('rel', 'noopener noreferrer');
    expect(image).toHaveAttribute('src', 'https://img.youtube.com/vi/pzUFmDhQEO8/sddefault.jpg');
    expect(screen.getByRole('button', { name: 'Enable cookies' })).toBeInTheDocument();
    expect(document.querySelector('youtube-player')).not.toBeInTheDocument();
  });

  it('emits enableCookies when the button is clicked', async () => {
    const onEnableCookies = vi.fn();
    const { user } = await setup({
      on: {
        enableCookies: onEnableCookies,
      },
    });

    await user.click(screen.getByRole('button', { name: 'Enable cookies' }));

    expect(onEnableCookies).toHaveBeenCalledOnce();
  });

  it('renders the embedded YouTube player when cookies are enabled', async () => {
    await setup({
      inputs: {
        hasCookiesEnabled: true,
      },
    });

    expect(document.querySelector('youtube-player')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enable cookies' })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /YouTube video thumbnail for Example video/i })).not.toBeInTheDocument();
  });

  it('uses the provided video id and label in generated URLs and alt text', async () => {
    await setup({
      inputs: {
        videoId: 'dQw4w9WgXcQ',
        label: 'Demo clip',
      },
    });

    const thumbnailLink = screen.getByRole('link', { name: /YouTube video thumbnail for Demo clip/i });
    const image = screen.getByRole('img', { name: /YouTube video thumbnail for Demo clip/i });

    expect(thumbnailLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(image).toHaveAttribute('src', 'https://img.youtube.com/vi/dQw4w9WgXcQ/sddefault.jpg');
    expect(image).toHaveAttribute('alt', 'YouTube video thumbnail for Demo clip');
  });
});
