import { isSignal, signal } from '@angular/core';
import { asSignal, asSignalWithDefault } from './signals';

describe('asSignal', () => {
  it('returns signals as they are', () => {
    const source = signal(1);

    expect(asSignal(source)).toBe(source);
  });

  it('wraps plain values in a read-only signal', () => {
    const wrapped = asSignal('value');

    expect(isSignal(wrapped)).toBe(true);
    expect(wrapped()).toBe('value');
  });

  it('wraps functions in a computed signal that tracks the signals they read', () => {
    const count = signal(1);
    const doubled = asSignal(() => count() * 2);

    expect(doubled()).toBe(2);

    count.set(2);
    expect(doubled()).toBe(4);
  });
});

describe('asSignalWithDefault', () => {
  it('falls back while the value is undefined', () => {
    const value = signal<number | undefined>(undefined);
    const withDefault = asSignalWithDefault(value, 5);

    expect(withDefault()).toBe(5);

    value.set(0);
    expect(withDefault()).toBe(0);
  });

  it('accepts plain values', () => {
    expect(asSignalWithDefault(undefined, 'fallback')()).toBe('fallback');
    expect(asSignalWithDefault('value', 'fallback')()).toBe('value');
  });
});
