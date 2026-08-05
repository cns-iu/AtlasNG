import type { UrlTree } from '@angular/router';
import { applyQueryParamsAndFragmentToUrl, isUrlTree, tryParseAbsoluteUrl } from './url';

const BASE_URL = 'https://example.com/path';

describe('isUrlTree', () => {
  it('returns true for UrlTree-like objects', () => {
    const value = {
      root: {},
      queryParams: {},
      fragment: null,
    };

    expect(isUrlTree(value)).toBe(true);
  });

  it('returns false for null and non-objects', () => {
    expect(isUrlTree(null)).toBe(false);
    expect(isUrlTree('url')).toBe(false);
    expect(isUrlTree(1)).toBe(false);
  });

  it('returns false when required keys are missing', () => {
    expect(isUrlTree({ root: {}, queryParams: {} })).toBe(false);
    expect(isUrlTree({ root: {}, fragment: null })).toBe(false);
    expect(isUrlTree({ queryParams: {}, fragment: null })).toBe(false);
  });
});

describe('tryParseAbsoluteUrl', () => {
  it('returns a URL instance for absolute URL strings', () => {
    const parsed = tryParseAbsoluteUrl(`${BASE_URL}?x=1#hash`);

    expect(parsed).toBeInstanceOf(URL);
    expect(parsed?.toString()).toBe(`${BASE_URL}?x=1#hash`);
  });

  it('returns a URL instance for single-value command arrays', () => {
    const parsed = tryParseAbsoluteUrl([BASE_URL]);

    expect(parsed).toBeInstanceOf(URL);
    expect(parsed?.toString()).toBe(BASE_URL);
  });

  it('returns null for relative URLs, invalid URLs, and non-string values', () => {
    expect(tryParseAbsoluteUrl('/relative/path')).toBeNull();
    expect(tryParseAbsoluteUrl('not a url')).toBeNull();
    expect(tryParseAbsoluteUrl([BASE_URL, 'https://example.org'])).toBeNull();
    expect(tryParseAbsoluteUrl(['../relative/path'])).toBeNull();
    expect(tryParseAbsoluteUrl(123)).toBeNull();
    expect(tryParseAbsoluteUrl(undefined)).toBeNull();
    expect(tryParseAbsoluteUrl(null)).toBeNull();
  });
});

describe('applyQueryParamsAndFragmentToUrl', () => {
  it('replaces query params and fragment by default', () => {
    const url = new URL(`${BASE_URL}?existing=1#old`);

    applyQueryParamsAndFragmentToUrl(url, {
      queryParams: { next: '2' },
      fragment: 'new',
    });

    expect(url.toString()).toBe(`${BASE_URL}?next=2#new`);
  });

  it('merges query params when queryParamsHandling is merge', () => {
    const url = new URL(`${BASE_URL}?existing=1&keep=2#old`);

    applyQueryParamsAndFragmentToUrl(url, {
      queryParamsHandling: 'merge',
      queryParams: {
        existing: '3',
        add: ['a', 'b'],
      },
    });

    expect(url.searchParams.get('keep')).toBe('2');
    expect(url.searchParams.get('existing')).toBe('3');
    expect(url.searchParams.getAll('add')).toEqual(['a', 'b']);
    expect(url.hash).toBe('#old');
  });

  it('preserves query params when queryParamsHandling is preserve', () => {
    const url = new URL(`${BASE_URL}?existing=1#old`);

    applyQueryParamsAndFragmentToUrl(url, {
      queryParamsHandling: 'preserve',
      queryParams: { next: '2' },
    });

    expect(url.toString()).toBe(`${BASE_URL}?existing=1#old`);
  });

  it('preserves fragment when preserveFragment is true', () => {
    const url = new URL(`${BASE_URL}#old`);

    applyQueryParamsAndFragmentToUrl(url, {
      fragment: 'new',
      preserveFragment: true,
    });

    expect(url.toString()).toBe(`${BASE_URL}#old`);
  });

  it('accepts UrlTree-like option objects from router APIs', () => {
    const urlTreeLike = { root: {}, queryParams: {}, fragment: null } as UrlTree;

    expect(isUrlTree(urlTreeLike)).toBe(true);
  });
});
