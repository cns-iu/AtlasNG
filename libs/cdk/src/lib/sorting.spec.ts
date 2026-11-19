import { Injector, LOCALE_ID, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { COLLATOR_OPTIONS, injectCollator, injectSorted, provideCollatorOptions, SortDirection } from './sorting';

interface Item {
  label: string;
  count: number;
}

function item(label: string, count = 0): Item {
  return { label, count };
}

function labels(items: readonly Item[]): string[] {
  return items.map((entry) => entry.label);
}

describe('COLLATOR_OPTIONS', () => {
  it('defaults to numeric, case- and accent-insensitive comparison', () => {
    expect(TestBed.inject(COLLATOR_OPTIONS)).toEqual({ numeric: true, sensitivity: 'base' });
  });

  it('can be overridden with provideCollatorOptions', () => {
    TestBed.configureTestingModule({ providers: [provideCollatorOptions({ sensitivity: 'variant' })] });

    expect(TestBed.inject(COLLATOR_OPTIONS)).toEqual({ sensitivity: 'variant' });
  });
});

describe('injectCollator', () => {
  it('compares numbers in numeric order and ignores case and accents', () => {
    const collator = TestBed.runInInjectionContext(() => injectCollator());

    expect(['Item 10', 'item 2', 'Item 1'].toSorted(collator.compare)).toEqual(['Item 1', 'item 2', 'Item 10']);
    expect(collator.compare('Éclair', 'eclair')).toBe(0);
  });

  it('uses the application locale', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'sv' }] });
    const collator = TestBed.runInInjectionContext(() => injectCollator());

    expect(collator.resolvedOptions().locale).toBe('sv');
    expect(['ö', 'z'].toSorted(collator.compare)).toEqual(['z', 'ö']);
  });

  it('accepts an injector outside an injection context', () => {
    const collator = injectCollator({ injector: TestBed.inject(Injector) });

    expect(collator.compare('a', 'b')).toBeLessThan(0);
  });

  it('throws outside an injection context without an injector', () => {
    expect(() => injectCollator()).toThrow();
  });
});

describe('injectSorted', () => {
  const unsorted = [item('Kidney', 3), item('adrenal gland', 1), item('Heart', 9), item('Blood vasculature', 9)];

  it('sorts by key in ascending order by default', () => {
    const sorted = TestBed.runInInjectionContext(() => injectSorted({ items: unsorted, key: (entry) => entry.label }));

    expect(labels(sorted())).toEqual(['adrenal gland', 'Blood vasculature', 'Heart', 'Kidney']);
  });

  it('sorts in descending order', () => {
    const sorted = TestBed.runInInjectionContext(() =>
      injectSorted({ items: unsorted, key: (entry) => entry.label, direction: 'desc' }),
    );

    expect(labels(sorted())).toEqual(['Kidney', 'Heart', 'Blood vasculature', 'adrenal gland']);
  });

  it('sorts with a custom comparator and keeps the input order of equal items in both directions', () => {
    const direction = signal<SortDirection>('asc');
    const sorted = TestBed.runInInjectionContext(() =>
      injectSorted({ items: unsorted, compare: (a, b) => a.count - b.count, direction }),
    );

    expect(labels(sorted())).toEqual(['adrenal gland', 'Kidney', 'Heart', 'Blood vasculature']);

    direction.set('desc');
    expect(labels(sorted())).toEqual(['Heart', 'Blood vasculature', 'Kidney', 'adrenal gland']);
  });

  it('returns the items unchanged while disabled', () => {
    const disabled = signal(true);
    const sorted = TestBed.runInInjectionContext(() =>
      injectSorted({ items: unsorted, key: (entry) => entry.label, disabled }),
    );

    expect(sorted()).toBe(unsorted);

    disabled.set(false);
    expect(labels(sorted())).toEqual(['adrenal gland', 'Blood vasculature', 'Heart', 'Kidney']);
  });

  it('updates when the items change without changing the input array', () => {
    const items = signal([item('b'), item('a')]);
    const sorted = TestBed.runInInjectionContext(() => injectSorted({ items, key: (entry) => entry.label }));

    expect(labels(sorted())).toEqual(['a', 'b']);
    expect(labels(items())).toEqual(['b', 'a']);

    items.set([item('d'), item('c')]);
    expect(labels(sorted())).toEqual(['c', 'd']);
  });

  it('reads functions as reactive options', () => {
    const descending = signal(false);
    const sorted = TestBed.runInInjectionContext(() =>
      injectSorted({
        items: () => unsorted,
        key: (entry) => entry.label,
        direction: () => (descending() ? 'desc' : 'asc'),
      }),
    );

    descending.set(true);
    expect(labels(sorted())[0]).toBe('Kidney');
  });

  it('uses the injected collator options', () => {
    TestBed.configureTestingModule({ providers: [provideCollatorOptions({ numeric: false })] });
    const sorted = TestBed.runInInjectionContext(() =>
      injectSorted({ items: [item('10'), item('9')], key: (entry) => entry.label }),
    );

    expect(labels(sorted())).toEqual(['10', '9']);
  });

  it('accepts an injector outside an injection context', () => {
    const injector = TestBed.inject(Injector);
    const sorted = runInInjectionContext(injector, () => injectSorted({ items: unsorted, compare: () => 0 }));
    const withInjector = injectSorted({ items: unsorted, key: (entry) => entry.label, injector });

    expect(sorted()).toEqual(unsorted);
    expect(labels(withInjector())[0]).toBe('adrenal gland');
  });

  it('throws outside an injection context without an injector', () => {
    expect(() => injectSorted({ items: unsorted, key: (entry) => entry.label })).toThrow();
  });

  it('rejects both key and compare at the type level', () => {
    TestBed.runInInjectionContext(() => {
      // @ts-expect-error key and compare are mutually exclusive
      injectSorted({ items: unsorted, key: (entry: Item) => entry.label, compare: () => 0 });
      // @ts-expect-error key or compare is required
      injectSorted({ items: unsorted });
    });
  });
});
