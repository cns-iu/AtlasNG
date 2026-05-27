import type { UrlTree } from '@angular/router';
import {
  canParseUrl,
  castArray,
  commandAttribute,
  isAnchorElement,
  isAnchorLikeCustomElement,
  isAnchorLikeElement,
  isUrlTree,
  safeMerge,
} from './utils';

describe('any-link utils', () => {
  describe('isAnchorElement', () => {
    it('returns true for anchor and area elements', () => {
      const anchor = { tagName: 'A' } as Element;
      const area = { tagName: 'AREA' } as Element;

      expect(isAnchorElement(anchor)).toBe(true);
      expect(isAnchorElement(area)).toBe(true);
    });

    it('returns false for non-anchor elements', () => {
      const div = { tagName: 'DIV' } as Element;

      expect(isAnchorElement(div)).toBe(false);
    });
  });

  describe('isAnchorLikeCustomElement', () => {
    it('returns false when the registry is undefined', () => {
      const element = { tagName: 'x-link' } as Element;

      expect(isAnchorLikeCustomElement(element, undefined)).toBe(false);
    });

    it('returns true when observedAttributes includes href', () => {
      const element = { tagName: 'x-link' } as Element;
      const registry = {
        get: vi.fn().mockReturnValue({ observedAttributes: ['href', 'target'] }),
      } as unknown as CustomElementRegistry;

      expect(isAnchorLikeCustomElement(element, registry)).toBe(true);
      expect(registry.get).toHaveBeenCalledWith('x-link');
    });

    it('returns false when observedAttributes does not include href', () => {
      const element = { tagName: 'x-link' } as Element;
      const registry = {
        get: vi.fn().mockReturnValue({ observedAttributes: ['target'] }),
      } as unknown as CustomElementRegistry;

      expect(isAnchorLikeCustomElement(element, registry)).toBe(false);
    });

    it('returns false when the constructor is not found', () => {
      const element = { tagName: 'x-link' } as Element;
      const registry = {
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as CustomElementRegistry;

      expect(isAnchorLikeCustomElement(element, registry)).toBe(false);
    });
  });

  describe('isAnchorLikeElement', () => {
    it('returns false when element is undefined', () => {
      const registry = {
        get: vi.fn(),
      } as unknown as CustomElementRegistry;

      expect(isAnchorLikeElement(undefined, registry)).toBe(false);
    });

    it('returns true for native anchor elements', () => {
      const element = { tagName: 'A' } as Element;

      expect(isAnchorLikeElement(element, undefined)).toBe(true);
    });

    it('returns true for anchor-like custom elements', () => {
      const element = { tagName: 'x-link' } as Element;
      const registry = {
        get: vi.fn().mockReturnValue({ observedAttributes: ['href'] }),
      } as unknown as CustomElementRegistry;

      expect(isAnchorLikeElement(element, registry)).toBe(true);
    });

    it('returns false for non-anchor-like elements', () => {
      const element = { tagName: 'DIV' } as Element;

      expect(isAnchorLikeElement(element, undefined)).toBe(false);
    });
  });

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

  describe('castArray', () => {
    it('wraps scalar values in an array', () => {
      expect(castArray('test')).toEqual(['test']);
      expect(castArray(42)).toEqual([42]);
    });

    it('returns the same array instance when value is already an array', () => {
      const values = ['a', 'b'];

      expect(castArray(values)).toBe(values);
    });
  });

  describe('canParseUrl', () => {
    it('returns true for absolute URLs', () => {
      expect(canParseUrl('https://example.com/path?x=1#hash')).toBe(true);
    });

    it('returns false for invalid or relative URLs', () => {
      expect(canParseUrl('not a url')).toBe(false);
      expect(canParseUrl('/relative/path')).toBe(false);
    });
  });

  describe('commandAttribute', () => {
    it('returns undefined for nullish values', () => {
      expect(commandAttribute(null)).toBeUndefined();
      expect(commandAttribute(undefined)).toBeUndefined();
    });

    it('passes through LinkCommand objects', () => {
      const command = { command: '/test', queryParams: { a: 1 } };

      expect(commandAttribute(command)).toBe(command);
    });

    it('wraps non-LinkCommand values into a LinkCommand', () => {
      expect(commandAttribute('/test')).toEqual({ command: '/test' });
      expect(commandAttribute(['/test'])).toEqual({ command: ['/test'] });

      const urlTreeLike = { root: {}, queryParams: {}, fragment: null } as UrlTree;
      expect(commandAttribute(urlTreeLike)).toEqual({ command: urlTreeLike });
    });
  });

  describe('safeMerge', () => {
    it('merges values from source into target', () => {
      const result = safeMerge({ a: 1 }, { b: 2 });

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('does not overwrite with undefined source values', () => {
      const result = safeMerge({ a: 1, b: 2 }, { a: undefined, b: 3 });

      expect(result).toEqual({ a: 1, b: 3 });
    });

    it('returns a new object reference', () => {
      const target = { a: 1 };
      const result = safeMerge(target, { b: 2 });

      expect(result).not.toBe(target);
      expect(target).toEqual({ a: 1 });
    });
  });
});
