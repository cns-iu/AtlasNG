import { render, screen } from '@testing-library/angular';
import { ServerErrorPage } from './server-error-page';

describe('ServerErrorPage', () => {
  it('renders the server error message and actions', async () => {
    await render(ServerErrorPage, {
      inputs: { reportIssueLink: 'https://example.com/issues' },
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Oops! We’re having a moment.' })).toBeVisible();
    expect(screen.getByText('Try refreshing the page or report the issue if it continues.')).toBeVisible();

    const reportIssue = screen.getByRole('link', { name: 'Report issue' });
    expect(reportIssue).toHaveAttribute('href', 'https://example.com/issues');
    expect(reportIssue).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: 'Go to homepage' })).toHaveAttribute('href', '/');
  });
});
