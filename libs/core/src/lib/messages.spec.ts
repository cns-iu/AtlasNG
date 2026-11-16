import { signal } from '@angular/core';
import { plural, resolveText } from './messages';

describe('resolveText', () => {
  it('returns a string as is', () => {
    expect(resolveText('Clear')).toBe('Clear');
  });

  it('calls a text function', () => {
    expect(resolveText(() => 'Clear')).toBe('Clear');
  });

  it('reads a signal', () => {
    const text = signal('Clear');
    text.set('Effacer');

    expect(resolveText(text)).toBe('Effacer');
  });
});

describe('plural', () => {
  const forms = { one: 'result', other: 'results' };

  it('selects the form for the count', () => {
    expect(plural('en-US', 1, forms)).toBe('result');
    expect(plural('en-US', 2, forms)).toBe('results');
  });

  it('uses the plural rules of the locale', () => {
    const polish = { one: 'wynik', few: 'wyniki', many: 'wyników', other: 'wyniku' };

    expect(plural('pl', 3, polish)).toBe('wyniki');
    expect(plural('pl', 5, polish)).toBe('wyników');
  });

  it('falls back to other for missing categories', () => {
    expect(plural('pl', 3, forms)).toBe('results');
  });
});
