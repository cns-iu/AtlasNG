import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LinkSnippet } from './link-snippet';

describe('LinkSnippet', () => {
  const url = 'https://www.example.com/resources/example';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function setup() {
    const user = userEvent.setup();
    const copy = vi.fn().mockReturnValue(true);
    const open = vi.fn();

    const result = await render(LinkSnippet, {
      inputs: { url },
      providers: [
        {
          provide: Clipboard,
          useValue: { copy },
        },
        {
          provide: MatSnackBar,
          useValue: { open },
        },
      ],
    });

    return { ...result, copy, open, user };
  }

  it('renders the URL and links to it', async () => {
    await setup();

    expect(screen.getByText('example.com/resources/example')).toBeVisible();
    expect(screen.getByRole('link', { name: 'example.com/resources/example' })).toHaveAttribute('href', url);
  });

  it('describes that the link opens in a new tab', async () => {
    await setup();

    const link = screen.getByRole('link', { name: 'example.com/resources/example' });
    expect(link).toHaveAccessibleDescription('Opens in a new tab');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('copies the URL and displays a confirmation snackbar', async () => {
    const { copy, open, user } = await setup();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(copy).toHaveBeenCalledOnce();
    expect(copy).toHaveBeenCalledWith(url);
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('Link copied', '', {
      duration: 2000,
      panelClass: 'ang-link-snippet--copy-notification-panel',
      politeness: 'polite',
      verticalPosition: 'top',
    });
  });

  it('reports a failure when the copy fails', async () => {
    const { copy, open, user } = await setup();
    copy.mockReturnValue(false);

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('Could not copy link', '', expect.objectContaining({ politeness: 'polite' }));
    expect(open).not.toHaveBeenCalledWith('Link copied', expect.anything(), expect.anything());
  });
});
