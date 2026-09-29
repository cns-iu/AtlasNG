import { render, screen } from '@testing-library/angular';
import { ContentHeader } from './content-header';

describe('ContentHeader', () => {
  function setup({ id, underlined }: { id?: string; underlined?: boolean } = {}) {
    return render(ContentHeader, {
      inputs: {
        tagline: 'Content title',
        level: 2,
        ...(id !== undefined && { id }),
        ...(underlined !== undefined && { underlined }),
      },
    });
  }

  it('renders the tagline at the requested heading level', async () => {
    await setup();

    expect(screen.getByRole('heading', { level: 2, name: 'Content title' })).toBeVisible();
  });

  it('applies a non-empty ID to the heading and links the tagline to it', async () => {
    await setup({ id: 'docs' });

    expect(screen.getByRole('heading', { name: 'Content title' })).toHaveAttribute('id', 'docs');
    expect(screen.getByRole('link', { name: 'Content title' })).toHaveAttribute('href', '/#docs');
  });

  it('renders the tagline without a link when an ID is not provided', async () => {
    await setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the tagline without a link or ID when the ID is empty', async () => {
    await setup({ id: '' });

    expect(screen.getByRole('heading', { name: 'Content title' })).not.toHaveAttribute('id');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a divider by default', async () => {
    await setup();

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('does not render a divider when underlined is false', async () => {
    await setup({ underlined: false });

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
