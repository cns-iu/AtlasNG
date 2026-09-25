import { render, screen } from '@testing-library/angular';
import { PageSection } from './page-section';

describe('PageSection', () => {
  it('renders a titled section with projected content', async () => {
    await render(
      '<ang-page-section title="Overview"><span angPageSectionContent>Section content</span></ang-page-section>',
      {
        imports: [PageSection],
      },
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('passes the heading ID to the section header', async () => {
    await render(
      '<ang-page-section title="Overview" id="overview"><span angPageSectionContent>Section content</span></ang-page-section>',
      { imports: [PageSection] },
    );

    expect(screen.getByRole('heading', { name: 'Overview' })).toHaveAttribute('id', 'overview');
  });

  it('can hide the heading divider', async () => {
    await render(
      '<ang-page-section title="Overview" [underlined]="false"><span angPageSectionContent>Section content</span></ang-page-section>',
      { imports: [PageSection] },
    );

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
