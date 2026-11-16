import { signal } from '@angular/core';
import { computedMessage, computedText, plural, resolveText } from './messages';

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

describe('computedText', () => {
  it('resolves the text', () => {
    const text = signal('Clear');
    const result = computedText(text);
    text.set('Effacer');

    expect(result()).toBe('Effacer');
  });

  it('prefers a defined source', () => {
    const source = signal<string | undefined>('Override');
    const result = computedText(source, 'Clear');

    expect(result()).toBe('Override');
    source.set(undefined);
    expect(result()).toBe('Clear');
  });
});

describe('computedMessage', () => {
  const message = ({ count }: { count: number }) => `${count} items`;

  it('builds the message from the params', () => {
    const count = signal(1);
    const result = computedMessage(message, () => ({ count: count() }));
    count.set(2);

    expect(result()).toBe('2 items');
  });

  it('prefers a defined source', () => {
    const source = signal<string | undefined>('Override');
    const result = computedMessage(source, message, () => ({ count: 1 }));

    expect(result()).toBe('Override');
    source.set(undefined);
    expect(result()).toBe('1 items');
  });
});
