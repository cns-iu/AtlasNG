import { render } from '@testing-library/angular';
import { EndOfResultsIndicator } from './end-of-results-indicator';

describe('EndOfResultsIndicator', () => {
  it('should create', async () => {
    const result = await render(EndOfResultsIndicator, {
      inputs: {
        count: 2,
      },
    });

    expect(result).toBeTruthy();
  });

  it('should display the result count and end message', async () => {
    const { container } = await render(EndOfResultsIndicator, {
      inputs: {
        count: 5,
      },
    });

    expect(container.textContent).toContain('Results:');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('End of results');
  });
});
