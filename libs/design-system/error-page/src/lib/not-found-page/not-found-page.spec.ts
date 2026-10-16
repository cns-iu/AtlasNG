import { render, screen } from '@testing-library/angular';
import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  it('renders the not found message and a link to the homepage', async () => {
    await render(NotFoundPage);

    expect(screen.getByRole('heading', { level: 1, name: "This page isn't available" })).toBeVisible();
    expect(screen.getByText('Check the URL or start fresh from the homepage:')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Go to homepage' })).toHaveAttribute('href', '/');
  });
});
