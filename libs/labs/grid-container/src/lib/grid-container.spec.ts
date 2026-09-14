import { render, screen } from '@testing-library/angular';
import { GridContainer } from './grid-container';

describe('GridContainer', () => {
  it('renders projected content', async () => {
    await render('<ang-grid-container><article>Grid item</article></ang-grid-container>', {
      imports: [GridContainer],
    });

    expect(screen.getByText('Grid item')).toBeInTheDocument();
  });

  it('sets the minimum item width custom property', async () => {
    await render('<ang-grid-container data-testid="grid" itemMinWidth="12rem" />', {
      imports: [GridContainer],
    });

    expect(screen.getByTestId('grid')).toHaveStyle('--ang-grid-container-item-min-width: 12rem');
  });
});
