import { render, screen } from '@testing-library/angular';
import { SkipToContentButton } from './skip-to-content-button';

describe('SkipToContentButton', () => {
  it('renders with default label', async () => {
    await render(SkipToContentButton, {
      inputs: {
        anchorId: 'main-content',
      },
    });

    expect(screen.getByText('Skip to main content')).toBeInTheDocument();
  });

  it('renders with custom label', async () => {
    await render(SkipToContentButton, {
      inputs: {
        anchorId: 'main-content',
        label: 'Skip to content area',
      },
    });

    expect(screen.getByText('Skip to content area')).toBeInTheDocument();
  });

  it('creates a link with correct anchor navigation', async () => {
    await render(SkipToContentButton, {
      inputs: {
        anchorId: 'page-main',
      },
    });

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/page-main');
  });
});
