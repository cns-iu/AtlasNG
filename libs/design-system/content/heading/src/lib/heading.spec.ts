import { render, screen } from '@testing-library/angular';
import { Heading, headingLevelAttribute } from './heading';

describe('Heading', () => {
  it.each([1, 2, 3, 4, 5, 6] as const)('renders a level %i heading', async (level) => {
    await render(Heading, {
      inputs: {
        level,
        tagline: `Level ${level}`,
      },
    });

    expect(screen.getByRole('heading', { level, name: `Level ${level}` })).toBeVisible();
  });

  it('coerces a numeric level attribute', async () => {
    await render('<ang-heading level="2" tagline="Section title" />', {
      imports: [Heading],
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Section title' })).toBeVisible();
  });

  it('applies an ID to the rendered heading', async () => {
    await render(Heading, {
      inputs: {
        level: 2,
        id: 'section-title',
        tagline: 'Section title',
      },
    });

    expect(screen.getByRole('heading', { name: 'Section title' })).toHaveAttribute('id', 'section-title');
  });

  it('does not add an empty ID attribute', async () => {
    await render(Heading, {
      inputs: {
        level: 2,
        tagline: 'Section title',
      },
    });

    expect(screen.getByRole('heading', { name: 'Section title' })).not.toHaveAttribute('id');
  });

  it('renders projected content instead of the tagline', async () => {
    await render('<ang-heading [level]="3" tagline="Fallback title"><em>Projected title</em></ang-heading>', {
      imports: [Heading],
    });

    const heading = screen.getByRole('heading', { level: 3, name: 'Projected title' });
    expect(heading).toContainElement(screen.getByText('Projected title'));
    expect(screen.queryByText('Fallback title')).not.toBeInTheDocument();
  });

  it.each([0, 1.5, 7, 'not-a-number'])('rejects invalid level %s', (level) => {
    expect(() => headingLevelAttribute(level)).toThrow(`Invalid heading level: ${level}`);
  });
});
