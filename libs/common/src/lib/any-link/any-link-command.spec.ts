import { UrlTree } from '@angular/router';
import type { LinkCommand } from '../links/handler';
import { commandAttribute, isAnyLinkCommand } from './any-link-command';

describe('isAnyLinkCommand', () => {
  it.each([
    { label: 'undefined', value: undefined },
    { label: 'null', value: null },
    { label: 'a string', value: '/products' },
    { label: 'a command array', value: ['/products', 42] },
    { label: 'a UrlTree', value: new UrlTree() },
    { label: 'a LinkCommand', value: { command: '/products', fragment: 'details' } },
  ])('returns true for $label', ({ value }) => {
    expect(isAnyLinkCommand(value)).toBe(true);
  });

  it.each([
    { label: 'a number', value: 42 },
    { label: 'a boolean', value: false },
    { label: 'a function', value: () => undefined },
    { label: 'an object without a command', value: { href: '/products' } },
  ])('returns false for $label', ({ value }) => {
    expect(isAnyLinkCommand(value)).toBe(false);
  });
});

describe('commandAttribute', () => {
  it.each([null, undefined])('returns undefined for an empty command value (%s)', (value) => {
    expect(commandAttribute(value)).toBeUndefined();
  });

  it.each([
    { label: 'a string', value: '/products' },
    { label: 'a command array', value: ['/products', 42] as const },
    { label: 'a UrlTree', value: new UrlTree() },
  ])('wraps $label in a LinkCommand', ({ value }) => {
    expect(commandAttribute(value)).toEqual({ command: value });
  });

  it('returns an existing LinkCommand unchanged', () => {
    const value: LinkCommand = {
      command: '/products',
      fragment: 'details',
      queryParams: { source: 'featured' },
    };

    expect(commandAttribute(value)).toBe(value);
  });
});
