import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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

    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    expect(screen.getByText('On this page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '/#introduction');
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('href', '/#details');
  });

  it('labels the navigation with a custom tagline', async () => {
    await render('<ang-table-of-contents tagline="Contents" [items]="items" />', {
      imports: [TableOfContents],
      componentProperties: { items },
    });

    expect(screen.getByRole('navigation', { name: 'Contents' })).toBeInTheDocument();
  });

  it('marks the active item matched by anchor', async () => {
    await render(TableOfContents, {
      inputs: { items, activeItem: { ...items[1] } },
    });

    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Introduction' })).not.toHaveAttribute('aria-current');
  });

  it('updates the active item when an item is activated', async () => {
    const user = userEvent.setup();
    const activeItemChange = vi.fn();
    const { fixture } = await render(TableOfContents, { inputs: { items } });
    fixture.componentInstance.activeItem.subscribe(activeItemChange);

    await user.click(screen.getByRole('link', { name: 'Introduction' }));

    expect(fixture.componentInstance.activeItem()).toBe(items[0]);
    expect(activeItemChange).toHaveBeenCalledWith(items[0]);
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('aria-current', 'page');
  });
});
