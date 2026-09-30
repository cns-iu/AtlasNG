import { render, screen } from '@testing-library/angular';
import { ContentSection } from './content-section';

describe('ContentSection', () => {
  it('renders a titled section with projected content', async () => {
    await render('<ang-content-section title="Overview" level="2"><span>Section content</span></ang-content-section>', {
      imports: [ContentSection],
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('passes the heading ID to the section header', async () => {
    await render(
      '<ang-content-section title="Overview" level="2" id="overview"><span>Section content</span></ang-content-section>',
      { imports: [ContentSection] },
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toHaveAttribute('id', 'overview');
  });

  it('can hide the heading divider', async () => {
    await render(
      '<ang-content-section title="Overview" level="2" [underlined]="false"><span>Section content</span></ang-content-section>',
      { imports: [ContentSection] },
    );

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
