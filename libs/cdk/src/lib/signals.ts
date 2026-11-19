import { computed, isSignal, Signal, signal } from '@angular/core';

/**
 * A value, or a signal or other function that returns it. Functions are read in a reactive context, so signals they
 * read are tracked.
 */
export type MaybeSignalLike<T> = T | (() => T);

/**
 * A signal or zero-argument function that returns a value. Unlike {@link MaybeSignalLike}, the value cannot be passed
 * directly, which keeps values that are functions themselves apart from the functions that return them.
 */
export type SignalLike<T> = Signal<T> | (() => T);

/**
 * Wraps a value in a signal. Signals are returned as they are and other functions are wrapped in a computed signal.
 *
 * @param value A value, signal, or function.
 * @returns A signal of the value.
 */
export function asSignal<T>(value: MaybeSignalLike<T>): Signal<T> {
  if (isSignal(value)) {
    return value as Signal<T>;
  }
  return typeof value === 'function' ? computed(value as () => T) : signal(value).asReadonly();
}
