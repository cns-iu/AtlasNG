import { render } from '@testing-library/angular';
import { EndOfResultsComponent } from './end-of-results.component';

describe('EndOfResultsComponent', () => {
  it('should create', async () => {
    const result = await render(EndOfResultsComponent, {
      componentInputs: {
        count: 2,
      },
    });

    expect(result).toBeTruthy();
  });

  it('should display the result count and end message', async () => {
    const { container } = await render(EndOfResultsComponent, {
      componentInputs: {
        count: 5,
      },
    });

    expect(container.textContent).toContain('Results:');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('End of results');
  });
});
