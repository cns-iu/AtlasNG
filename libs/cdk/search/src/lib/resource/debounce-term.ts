import { effect, EffectRef, Injector, linkedSignal, Signal, untracked } from '@angular/core';

/** A debounced search term. */
export interface DebouncedTerm {
  /** The debounced term. */
  readonly term: Signal<string>;
  /** The effect that schedules debounced terms. Destroy it to stop debouncing. */
  readonly effectRef: EffectRef;
}

/**
 * Debounces a search term. Terms shorter than the minimum length, such as a cleared term, apply immediately, as does
 * every term while the delay is `0` or less.
 *
 * @param term Search term.
 * @param delay Debounce in milliseconds.
 * @param minLength Minimum trimmed term length that triggers a search.
 * @param injector Injector for the debounce effect.
 * @returns The debounced term and the effect that schedules it.
 */
export function debounceTerm(
  term: Signal<string>,
  delay: Signal<number>,
  minLength: Signal<number>,
  injector: Injector,
): DebouncedTerm {
  const immediate = (value: string): boolean => delay() <= 0 || value.trim().length < minLength();
  // Applies immediate terms synchronously and otherwise keeps the last applied term until the timeout below fires
  const applied = linkedSignal<{ value: string; immediate: boolean }, string>({
    source: () => {
      const value = term();
      return { value, immediate: immediate(value) };
    },
    computation: (current, previous) => (current.immediate || !previous ? current.value : previous.value),
  });
  // Read once so the initial term is applied before it can change
  untracked(applied);
  const effectRef = effect(
    (onCleanup) => {
      const value = term();
      if (!immediate(value)) {
        const timeout = setTimeout(() => applied.set(value), delay());
        onCleanup(() => clearTimeout(timeout));
      }
    },
    { injector },
  );
  return { term: applied.asReadonly(), effectRef };
}
