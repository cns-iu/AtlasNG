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
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const open = vi.fn();

    const result = await render(LinkSnippet, {
      inputs: { url },
      providers: [
        {
          provide: MatSnackBar,
          useValue: { open },
        },
      ],
    });

    return { ...result, open, user, writeText };
  }

  it('renders the URL and links to it', async () => {
    await setup();

    expect(screen.getByText('example.com/resources/example')).toBeVisible();
    expect(screen.getByRole('link', { name: 'example.com/resources/example' })).toHaveAttribute('href', url);
  });

  it('copies the URL and displays a confirmation snackbar', async () => {
    const { open, user, writeText } = await setup();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText).toHaveBeenCalledWith(url);
    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith('Link copied', '', {
      duration: 2000,
      panelClass: 'ang-link-snippet--copy-notification-panel',
      politeness: 'polite',
      verticalPosition: 'top',
    });
  });
});
