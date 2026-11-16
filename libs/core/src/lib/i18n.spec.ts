import { Injector, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  computedMessage,
  computedText,
  getMessageContext,
  injectMessageContext,
  type Message,
  resolveText,
} from './i18n';

const message: Message<{ count: number }> = ({ count }, { number, plural }) =>
  `${number(count)} ${plural(count, { one: 'item', other: 'items' })}`;

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

describe('getMessageContext', () => {
  it('returns the same context for a locale', () => {
    expect(getMessageContext('en-US')).toBe(getMessageContext('en-US'));
    expect(getMessageContext('en-US')).not.toBe(getMessageContext('sv-SE'));
  });

  it('formats numbers for the locale', () => {
    const { number } = getMessageContext('sv-SE');

    expect(number(1000000)).toMatch(/^1\s000\s000$/);
    expect(getMessageContext('en-US').number(1500, { notation: 'compact' })).toBe('1.5K');
  });

  it('selects plural forms with the rules of the locale', () => {
    const polish = { one: 'wynik', few: 'wyniki', many: 'wyników', other: 'wyniku' };
    const { plural } = getMessageContext('pl');

    expect(plural(1, polish)).toBe('wynik');
    expect(plural(3, polish)).toBe('wyniki');
    expect(plural(5, polish)).toBe('wyników');
    expect(plural(3, { other: 'results' })).toBe('results');
  });
});

describe('injectMessageContext', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'sv-SE' }] });
  });

  it('injects the context of the active locale', () => {
    expect(TestBed.runInInjectionContext(() => injectMessageContext())).toBe(getMessageContext('sv-SE'));
  });

  it('injects from a given injector outside an injection context', () => {
    expect(injectMessageContext({ injector: TestBed.inject(Injector) })).toBe(getMessageContext('sv-SE'));
  });

  it('throws outside an injection context without an injector', () => {
    expect(() => injectMessageContext()).toThrow();
  });
});

describe('computedMessage', () => {
  const context = getMessageContext('en-US');

  it('builds the message from the params', () => {
    const count = signal(1);
    const result = computedMessage(message, () => ({ count: count() }), context);

    expect(result()).toBe('1 item');
    count.set(2000);
    expect(result()).toBe('2,000 items');
  });

  it('prefers a defined source', () => {
    const source = signal<string | undefined>('Override');
    const result = computedMessage(source, message, () => ({ count: 1 }), context);

    expect(result()).toBe('Override');
    source.set(undefined);
    expect(result()).toBe('1 item');
  });
});

describe('computedMessage without a context', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'sv-SE' }] });
  });

  it('uses the locale of the injection context', () => {
    const result = TestBed.runInInjectionContext(() => computedMessage(message, () => ({ count: 2000 })));

    expect(result()).toMatch(/^2\s000 items$/);
  });

  it('uses the locale of a given injector', () => {
    const result = computedMessage(message, () => ({ count: 2000 }), { injector: TestBed.inject(Injector) });

    expect(result()).toMatch(/^2\s000 items$/);
  });

  it('throws outside an injection context without an injector', () => {
    expect(() => computedMessage(message, () => ({ count: 1 }))).toThrow();
  });
});
