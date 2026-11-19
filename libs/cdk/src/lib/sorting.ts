import {
  assertInInjectionContext,
  computed,
  inject,
  InjectionToken,
  Injector,
  LOCALE_ID,
  Provider,
  Signal,
} from '@angular/core';
import type { RequireExactlyOne } from 'type-fest';
import { asSignal, MaybeSignalLike } from '@atlasng/core';

/** Sort direction: ascending (`'asc'`) or descending (`'desc'`). */
export type SortDirection = 'asc' | 'desc';

/** Collator options used by {@link injectCollator}. Defaults to numeric, case- and accent-insensitive comparison. */
export const COLLATOR_OPTIONS = new InjectionToken<Intl.CollatorOptions>('COLLATOR_OPTIONS', {
  providedIn: 'root',
  factory: () => ({ numeric: true, sensitivity: 'base' }),
});

/**
 * Overrides the collator options used by {@link injectCollator} and {@link injectSorted}.
 *
 * @param options Options passed to `Intl.Collator`. They replace the defaults rather than merging with them.
 * @returns A provider for {@link COLLATOR_OPTIONS}.
 */
export function provideCollatorOptions(options: Intl.CollatorOptions): Provider {
  return { provide: COLLATOR_OPTIONS, useValue: options };
}

/** Options for {@link injectCollator}. */
export interface InjectCollatorOptions {
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/**
 * Creates a collator for the application locale (`LOCALE_ID`) and the injected {@link COLLATOR_OPTIONS}. Must be
 * called in an injection context unless an injector is provided.
 *
 * @param options Collator options.
 * @returns A collator whose `compare` method orders strings for display.
 * @example
 * readonly #collator = injectCollator();
 * readonly sorted = computed(() => this.names().toSorted(this.#collator.compare));
 */
export function injectCollator(options: InjectCollatorOptions = {}): Intl.Collator {
  if (!options.injector) {
    assertInInjectionContext(injectCollator);
  }
  const injector = options.injector ?? inject(Injector);
  return new Intl.Collator(injector.get(LOCALE_ID), injector.get(COLLATOR_OPTIONS));
}

/** Options shared by every {@link injectSorted} call, before `key` and `compare` are made mutually exclusive. */
interface InjectSortedBaseOptions<T> {
  /** Items to sort. The input array is never changed. */
  items: MaybeSignalLike<readonly T[]>;
  /** String to sort each item by, compared with {@link injectCollator}. Exclusive with `compare`. */
  key: (item: T) => string;
  /** Custom comparator, used in place of the collator. Exclusive with `key`. */
  compare: (a: T, b: T) => number;
  /** Sort direction. Defaults to `'asc'`. Items that compare equal keep their input order in both directions. */
  direction?: MaybeSignalLike<SortDirection | undefined>;
  /** Whether to return the items in their input order instead of sorting them. Defaults to `false`. */
  disabled?: MaybeSignalLike<boolean | undefined>;
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/**
 * Options for {@link injectSorted}. Exactly one of `key` and `compare` sets the order. Both are plain functions that
 * are not read reactively; `items`, `direction`, and `disabled` accept a value, signal, or function.
 */
export type InjectSortedOptions<T> = RequireExactlyOne<InjectSortedBaseOptions<T>, 'key' | 'compare'>;

/**
 * Sorts a list of items and exposes them as a signal that updates when the items, direction, or disabled state
 * change. Must be called in an injection context unless an injector is provided.
 *
 * @param options Sort options.
 * @returns A signal of the sorted items, or of the input items while sorting is disabled.
 * @example
 * readonly options = input.required<Option[]>();
 * readonly sorted = injectSorted({ items: this.options, key: (option) => option.label });
 */
export function injectSorted<T>(options: InjectSortedOptions<T>): Signal<readonly T[]> {
  if (!options.injector) {
    assertInInjectionContext(injectSorted);
  }
  const injector = options.injector ?? inject(Injector);
  const compare = options.compare ?? keyComparator(options.key, injectCollator({ injector }));

  const items = asSignal(options.items);
  const direction = asSignal(options.direction);
  const disabled = asSignal(options.disabled);

  return computed(() => {
    if (disabled()) {
      return items();
    }
    const sign = direction() === 'desc' ? -1 : 1;
    return items().toSorted((a, b) => sign * compare(a, b));
  });
}

/**
 * Creates a comparator that compares items by a string key.
 *
 * @param key Returns the string to compare for an item.
 * @param collator Collator that compares the strings.
 * @returns A comparator of items.
 */
function keyComparator<T>(key: (item: T) => string, collator: Intl.Collator): (a: T, b: T) => number {
  return (a, b) => collator.compare(key(a), key(b));
}
