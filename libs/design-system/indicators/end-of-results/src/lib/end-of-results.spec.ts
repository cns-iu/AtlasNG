import { render } from '@testing-library/angular';
import { EndOfResults } from './end-of-results';

describe('EndOfResults', () => {
  it('should create', async () => {
    const result = await render(EndOfResults, {
      inputs: {
        count: 2,
      },
    });

    expect(result).toBeTruthy();
  });

  it('should display the result count and end message', async () => {
    const { container } = await render(EndOfResults, {
      inputs: {
        count: 5,
      },
    });

    expect(container.textContent).toContain('Results:');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('End of results');
  });
});
