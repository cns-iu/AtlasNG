import { registerLocaleData } from '@angular/common';
import localeSv from '@angular/common/locales/sv';
import { LOCALE_ID } from '@angular/core';
import { ComponentInput, render, screen } from '@testing-library/angular';
import { ResultsIndicator } from './results-indicator';

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

  const visibleText = (text: string | RegExp) => screen.getByText(text, { ignore: '.cdk-visually-hidden' });
  const announcedText = (text: string) => screen.getByText(text, { selector: '.cdk-visually-hidden' });

  beforeAll(() => {
    registerLocaleData(localeSv);
  });

  it('should render default text as "[value] of [total]"', async () => {
    await setup();

    expect(visibleText('5 of 120')).toBeInTheDocument();
  });

  it('should include prefix, custom separator, and suffix', async () => {
    await setup({
      prefix: 'Showing',
      separator: 'out of',
      suffix: 'results',
    });

    expect(visibleText('Showing 5 out of 120 results')).toBeInTheDocument();
  });

  it('should format numbers using the active locale', async () => {
    await setup(
      {
        value: 1000,
        total: 1000000,
      },
      'sv-SE',
    );

    expect(visibleText(/^1\s000 of 1\s000\s000$/)).toBeInTheDocument();
  });

  it('should be a status live region that reads the text', async () => {
    await setup();

    expect(screen.getByRole('status')).toContainElement(announcedText('5 of 120'));
    expect(visibleText('5 of 120')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should announce the text once it stops changing', async () => {
    const { fixture } = await setup();
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput('value', 6);
      fixture.detectChanges();
      vi.advanceTimersByTime(500);
      fixture.componentRef.setInput('value', 7);
      fixture.detectChanges();
      vi.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(visibleText('7 of 120')).toBeInTheDocument();
      expect(announcedText('5 of 120')).toBeInTheDocument();

      vi.advanceTimersByTime(500);
      fixture.detectChanges();

      expect(announcedText('7 of 120')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should drop the status role and update the read text immediately when announcements are disabled', async () => {
    const { fixture } = await setup({ announceDisabled: true });

    fixture.componentRef.setInput('value', 6);
    fixture.detectChanges();

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(announcedText('6 of 120')).toBeInTheDocument();
  });
});
