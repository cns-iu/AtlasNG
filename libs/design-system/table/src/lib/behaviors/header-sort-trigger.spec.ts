import { render, screen } from '@testing-library/angular';
import { HeaderSortTrigger } from './header-sort-trigger';

describe('HeaderSortTrigger', () => {
  it('applies its host class', async () => {
    await render(`<span [angHeaderSortTrigger]="sortFn">Sort</span>`, {
      imports: [HeaderSortTrigger],
      componentProperties: { sortFn: vi.fn() },
    });

    expect(screen.getByText('Sort')).toHaveClass('ang-table--header-sort-trigger');
  });
});
