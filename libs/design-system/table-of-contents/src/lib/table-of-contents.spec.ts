import { render, screen } from '@testing-library/angular';
import { TableOfContents, TableOfContentsItem } from './table-of-contents';

const items: TableOfContentsItem[] = [
  { tagline: 'Introduction', level: 2, anchor: 'introduction' },
  { tagline: 'Details', level: 3, anchor: 'details' },
];

describe('TableOfContents', () => {
  it('renders each page item as a navigation entry', async () => {
    await render('<ang-table-of-contents [items]="items" />', {
      imports: [TableOfContents],
      componentProperties: { items },
    });

    expect(screen.getByRole('navigation', { name: 'Table of contents' })).toBeInTheDocument();
    expect(screen.getByText('On this page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '/#introduction');
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/#details');
  });
});
