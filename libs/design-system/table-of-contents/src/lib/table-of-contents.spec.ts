import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { PageSectionInstance, TableOfContents } from './table-of-contents';

const sections: PageSectionInstance[] = [
  { tagline: 'Introduction', level: 2, anchor: 'introduction' },
  { tagline: 'Details', level: 3, anchor: 'details' },
];

describe('TableOfContents', () => {
  it('renders each page section as a navigation entry', async () => {
    await render('<ang-table-of-contents [sections]="sections" [showFirstSection]="true" />', {
      imports: [TableOfContents],
      componentProperties: { sections, showFirstSection: true },
    });

    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
    expect(screen.getByText('On this page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '/#introduction');
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/#details');
  });

  it('highlights the clicked entry and emits its anchor', async () => {
    const user = userEvent.setup();
    const anchorSelected = vi.fn();
    await render('<ang-table-of-contents [sections]="sections" (anchorSelected)="anchorSelected($event)" />', {
      imports: [TableOfContents],
      componentProperties: { sections, anchorSelected },
    });

    const details = screen.getByRole('link', { name: 'Details' });
    await user.click(details);

    expect(details).toHaveAttribute('aria-current', 'page');
    expect(anchorSelected).toHaveBeenCalledWith('details');
  });
});
