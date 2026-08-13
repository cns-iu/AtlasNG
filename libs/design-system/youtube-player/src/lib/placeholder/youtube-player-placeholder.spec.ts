import { ComponentInput, render, screen } from '@testing-library/angular';
import { YouTubePlayerPlaceholder } from './youtube-player-placeholder';

describe('YouTubePlayerPlaceholder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup(inputs: ComponentInput<YouTubePlayerPlaceholder> = {}) {
    return render(YouTubePlayerPlaceholder, {
      inputs: {
        videoId: 'pzUFmDhQEO8',
        width: 640,
        height: 390,
        buttonLabel: 'Play example video',
        quality: 'standard',
        ...inputs,
      },
    });
  }

  it('renders one accessible link that opens the video on YouTube', async () => {
    await setup();

    const link = screen.getByRole('link', { name: 'Play example video' });

    expect(link).toHaveAttribute('href', 'https://www.youtube.com/watch?v=pzUFmDhQEO8');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies the requested dimensions to the placeholder', async () => {
    const { fixture } = await setup({ width: 800, height: 450 });

    expect(fixture.nativeElement).toHaveStyle({ width: '800px', height: '450px' });
  });

  it.each([
    ['low', 'https://i.ytimg.com/vi/pzUFmDhQEO8/hqdefault.jpg'],
    ['standard', 'https://i.ytimg.com/vi_webp/pzUFmDhQEO8/sddefault.webp'],
    ['high', 'https://i.ytimg.com/vi/pzUFmDhQEO8/maxresdefault.jpg'],
  ] as const)('uses the %s-quality placeholder image', async (quality, source) => {
    await setup({ quality });

    expect(screen.getByRole('presentation')).toHaveAttribute('src', source);
  });

  it('omits the placeholder image and reports an invalid video ID in development mode', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await setup({ videoId: 'invalid/video/id' });

    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(
      'Skipping placeholder image generation for invalid YouTube video ID: invalid/video/id',
    );
  });
});
