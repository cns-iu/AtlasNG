import { LiveAnnouncer } from '@angular/cdk/a11y';
import { registerLocaleData } from '@angular/common';
import localeSv from '@angular/common/locales/sv';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

  const visibleText = (text: string | RegExp) => screen.getByText(text);

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

  it('should announce the text once it stops changing', async () => {
    const { fixture } = await setup();
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput('value', 6);
      fixture.detectChanges();
      vi.advanceTimersByTime(500);
      fixture.componentRef.setInput('value', 7);
      fixture.detectChanges();
      vi.advanceTimersByTime(1000);

      expect(visibleText('7 of 120')).toBeInTheDocument();
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenCalledWith('7 of 120', undefined, undefined);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should not announce changes when announcements are disabled', async () => {
    const { fixture } = await setup({ disableAnnouncements: true });
    const announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    vi.useFakeTimers();
    try {
      fixture.componentRef.setInput('value', 6);
      fixture.detectChanges();
      vi.advanceTimersByTime(1000);

      expect(visibleText('6 of 120')).toBeInTheDocument();
      expect(announce).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
