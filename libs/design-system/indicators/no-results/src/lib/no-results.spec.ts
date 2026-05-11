import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NoResults } from './no-results';

describe('NoResults', () => {
  it('should render the component', async () => {
    await render(NoResults);
  });

  it('should emit clearFilters on button click', async () => {
    const { fixture } = await render(NoResults);
    let emitCount = 0;
    fixture.componentInstance.clearFilters.subscribe(() => {
      emitCount += 1;
    });

    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    expect(emitCount).toBe(1);
  });
});
