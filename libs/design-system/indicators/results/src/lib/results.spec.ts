import { registerLocaleData } from '@angular/common';
import localeSv from '@angular/common/locales/sv';
import { LOCALE_ID } from '@angular/core';
import { ComponentInput, render } from '@testing-library/angular';
import { ResultsIndicator } from './results';

describe('ResultsIndicator', () => {
  const defaultInputs = {
    value: 5,
    total: 120,
  };

  function setup(inputs: ComponentInput<ResultsIndicator> = {}, locale = 'en-US') {
    return render(ResultsIndicator, {
      inputs: {
        ...defaultInputs,
        ...inputs,
      },
      providers: [{ provide: LOCALE_ID, useValue: locale }],
    });
  }

  beforeAll(() => {
    registerLocaleData(localeSv);
  });

  it('should render default text as "[value] of [total]"', async () => {
    const { container } = await setup();

    expect(container).toHaveTextContent('5 of 120');
  });

  it('should include prefix, custom separator, and suffix', async () => {
    const { container } = await setup({
      prefix: 'Showing',
      separator: 'out of',
      suffix: 'results',
    });

    expect(container).toHaveTextContent('Showing 5 out of 120 results');
  });

  it('should format numbers using the active locale', async () => {
    const { container } = await setup(
      {
        value: 1000,
        total: 1000000,
      },
      'sv-SE',
    );

    expect(container).toHaveTextContent(/^1\s000 of 1\s000\s000$/);
  });
});
