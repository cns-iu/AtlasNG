import { render, screen } from '@testing-library/angular';
import { SectionHeader } from './section-header';

describe('SectionHeader', () => {
  function setup({ id, underlined }: { id?: string; underlined?: boolean } = {}) {
    const idBinding = id !== undefined ? ` [id]="'${id}'"` : '';
    const underlinedBinding = underlined !== undefined ? ` [underlined]="${underlined}"` : '';

    return render(`<h2 angSectionHeader${idBinding}${underlinedBinding}>Section Title</h2>`, {
      imports: [SectionHeader],
    });
  }

  it('renders projected heading content', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument();
  });

  it('renders an anchor link to the matching hash when id is provided', async () => {
    const { container } = await setup({ id: 'docs' });

    const link = container.querySelector('a.ang-section-header--link');

    expect(link).toHaveAttribute('href', '/#docs');
  });

  it('does not render an anchor link when anchor is not provided', async () => {
    await setup();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a divider by default', async () => {
    const { container } = await setup();

    expect(container.querySelector('mat-divider')).toBeInTheDocument();
  });

  it('does not render a divider when underlined is false', async () => {
    const { container } = await setup({ underlined: false });

    expect(container.querySelector('mat-divider')).not.toBeInTheDocument();
  });
});
