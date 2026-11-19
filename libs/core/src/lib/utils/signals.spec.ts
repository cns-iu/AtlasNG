import { isSignal, signal } from '@angular/core';
import { asSignal } from './signals';

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
