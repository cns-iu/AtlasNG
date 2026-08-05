import type { IsActiveMatchOptions } from '@angular/router';
import { isUrlActive } from './compare-url';

describe('isUrlActive', () => {
  /**
   * Create complete URL match options with exact matching as the default.
   *
   * @param overrides Match options to override
   * @returns Complete match options
   */
  function matchOptions(overrides: Partial<IsActiveMatchOptions> = {}): IsActiveMatchOptions {
    return {
      fragment: 'exact',
      matrixParams: 'exact',
      paths: 'exact',
      queryParams: 'exact',
      ...overrides,
    };
  }

  describe('origins', () => {
    it('matches relative URLs against the local base', () => {
      expect(isUrlActive('/docs', '/docs', matchOptions())).toBe(true);
    });

    it('matches absolute URLs with the same origin', () => {
      expect(isUrlActive('https://example.com/docs', 'https://example.com/docs', matchOptions())).toBe(true);
    });

    it('does not match absolute URLs with different origins', () => {
      expect(isUrlActive('https://example.com/docs', 'https://other.example/docs', matchOptions())).toBe(false);
    });

    it('does not match an absolute target against a relative URL from another origin', () => {
      expect(isUrlActive('https://example.com/docs', '/docs', matchOptions())).toBe(false);
    });
  });

  describe('paths', () => {
    it('matches identical paths exactly', () => {
      expect(isUrlActive('/docs/guide', '/docs/guide', matchOptions())).toBe(true);
    });

    it('does not match paths with different segments', () => {
      expect(isUrlActive('/docs/start', '/docs/guide', matchOptions())).toBe(false);
    });

    it('does not match a shorter target path exactly', () => {
      expect(isUrlActive('/docs', '/docs/guide', matchOptions())).toBe(false);
    });

    it('does not match a longer target path exactly', () => {
      expect(isUrlActive('/docs/guide', '/docs', matchOptions())).toBe(false);
    });

    it('matches a target path prefix in subset mode', () => {
      expect(isUrlActive('/docs', '/docs/guide/start', matchOptions({ paths: 'subset' }))).toBe(true);
    });

    it('does not match a longer target path in subset mode', () => {
      expect(isUrlActive('/docs/guide', '/docs', matchOptions({ paths: 'subset' }))).toBe(false);
    });

    it('does not match a different path prefix in subset mode', () => {
      expect(isUrlActive('/api', '/docs/guide', matchOptions({ paths: 'subset' }))).toBe(false);
    });

    it('matches the root path as a subset of any path', () => {
      expect(isUrlActive('/', '/docs/guide', matchOptions({ paths: 'subset' }))).toBe(true);
    });

    it('normalizes trailing slashes', () => {
      expect(isUrlActive('/docs///', '/docs', matchOptions())).toBe(true);
    });

    it('compares path segments case-sensitively', () => {
      expect(isUrlActive('/Docs', '/docs', matchOptions())).toBe(false);
    });

    it('compares decoded pathnames', () => {
      expect(isUrlActive('/caf%C3%A9/%41', '/café/A', matchOptions())).toBe(true);
    });
  });

  describe('matrix parameters', () => {
    it('matches identical matrix parameters exactly', () => {
      expect(isUrlActive('/docs;view=full', '/docs;view=full', matchOptions())).toBe(true);
    });

    it('matches reordered matrix parameters exactly', () => {
      expect(isUrlActive('/docs;view=full;lang=en', '/docs;lang=en;view=full', matchOptions())).toBe(true);
    });

    it('does not match an additional current matrix parameter exactly', () => {
      expect(isUrlActive('/docs;view=full', '/docs;view=full;lang=en', matchOptions())).toBe(false);
    });

    it('does not match a missing current matrix parameter exactly', () => {
      expect(isUrlActive('/docs;view=full;lang=en', '/docs;view=full', matchOptions())).toBe(false);
    });

    it('does not match a different matrix parameter value', () => {
      expect(isUrlActive('/docs;view=full', '/docs;view=compact', matchOptions())).toBe(false);
    });

    it('matches target matrix parameters when the current segment has extras in subset mode', () => {
      expect(isUrlActive('/docs;view=full', '/docs;view=full;lang=en', matchOptions({ matrixParams: 'subset' }))).toBe(
        true,
      );
    });

    it('does not match missing current matrix parameters in subset mode', () => {
      expect(isUrlActive('/docs;view=full;lang=en', '/docs;view=full', matchOptions({ matrixParams: 'subset' }))).toBe(
        false,
      );
    });

    it('ignores matrix parameter differences when configured', () => {
      expect(isUrlActive('/docs;view=full', '/docs;lang=en', matchOptions({ matrixParams: 'ignored' }))).toBe(true);
    });

    it('compares matrix parameter keys case-insensitively', () => {
      expect(isUrlActive('/docs;VIEW=full', '/docs;view=full', matchOptions())).toBe(true);
    });

    it('supports matrix parameter values containing equals signs', () => {
      expect(isUrlActive('/docs;filter=a=b', '/docs;filter=a=b', matchOptions())).toBe(true);
    });

    it('compares decoded matrix parameters', () => {
      expect(isUrlActive('/docs;v%69ew=f%75ll', '/docs;view=full', matchOptions())).toBe(true);
    });

    it('compares matrix parameters only on path segments included by a path subset', () => {
      expect(
        isUrlActive(
          '/docs;view=full',
          '/docs;view=full/guide;section=intro',
          matchOptions({ matrixParams: 'exact', paths: 'subset' }),
        ),
      ).toBe(true);
    });
  });

  describe('query parameters', () => {
    it('matches identical query parameters exactly', () => {
      expect(isUrlActive('/docs?view=full', '/docs?view=full', matchOptions())).toBe(true);
    });

    it('matches reordered query parameters exactly', () => {
      expect(isUrlActive('/docs?view=full&lang=en', '/docs?lang=en&view=full', matchOptions())).toBe(true);
    });

    it('does not match an additional current query parameter exactly', () => {
      expect(isUrlActive('/docs?view=full', '/docs?view=full&lang=en', matchOptions())).toBe(false);
    });

    it('does not match a missing current query parameter exactly', () => {
      expect(isUrlActive('/docs?view=full&lang=en', '/docs?view=full', matchOptions())).toBe(false);
    });

    it('does not match a different query parameter value', () => {
      expect(isUrlActive('/docs?view=full', '/docs?view=compact', matchOptions())).toBe(false);
    });

    it('matches target query parameters when the current URL has extras in subset mode', () => {
      expect(isUrlActive('/docs?view=full', '/docs?view=full&lang=en', matchOptions({ queryParams: 'subset' }))).toBe(
        true,
      );
    });

    it('does not match missing current query parameters in subset mode', () => {
      expect(isUrlActive('/docs?view=full&lang=en', '/docs?view=full', matchOptions({ queryParams: 'subset' }))).toBe(
        false,
      );
    });

    it('does not reuse one current entry for duplicate target parameters', () => {
      expect(isUrlActive('/docs?tag=a&tag=a', '/docs?tag=a', matchOptions({ queryParams: 'subset' }))).toBe(false);
    });

    it('matches duplicate query parameters regardless of order', () => {
      expect(isUrlActive('/docs?tag=a&tag=b', '/docs?tag=b&tag=a', matchOptions())).toBe(true);
    });

    it('ignores query parameter differences when configured', () => {
      expect(isUrlActive('/docs?view=full', '/docs?lang=en', matchOptions({ queryParams: 'ignored' }))).toBe(true);
    });

    it('compares query parameter keys case-insensitively', () => {
      expect(isUrlActive('/docs?VIEW=full', '/docs?view=full', matchOptions())).toBe(true);
    });

    it('compares decoded query parameter keys and values', () => {
      expect(isUrlActive('/docs?v%69ew=full+page', '/docs?view=full%20page', matchOptions())).toBe(true);
    });
  });

  describe('fragments', () => {
    it('matches identical fragments exactly', () => {
      expect(isUrlActive('/docs#intro', '/docs#intro', matchOptions())).toBe(true);
    });

    it('does not match different fragments exactly', () => {
      expect(isUrlActive('/docs#intro', '/docs#api', matchOptions())).toBe(false);
    });

    it('does not match a missing current fragment exactly', () => {
      expect(isUrlActive('/docs#intro', '/docs', matchOptions())).toBe(false);
    });

    it('does not match an additional current fragment exactly', () => {
      expect(isUrlActive('/docs', '/docs#intro', matchOptions())).toBe(false);
    });

    it('ignores fragment differences when configured', () => {
      expect(isUrlActive('/docs#intro', '/docs#api', matchOptions({ fragment: 'ignored' }))).toBe(true);
    });

    it('compares fragments case-sensitively', () => {
      expect(isUrlActive('/docs#Intro', '/docs#intro', matchOptions())).toBe(false);
    });

    it('compares decoded fragments', () => {
      expect(isUrlActive('/docs#caf%C3%A9%20%41', '/docs#café A', matchOptions())).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('throws when a URL cannot be parsed', () => {
      expect(() => isUrlActive('http://[invalid', '/docs', matchOptions())).toThrow(TypeError);
    });

    it('throws when a pathname contains invalid percent encoding', () => {
      expect(() => isUrlActive('/docs/%ZZ', '/docs', matchOptions())).toThrow(URIError);
    });

    it('throws when a fragment contains invalid percent encoding', () => {
      expect(() => isUrlActive('/docs#%ZZ', '/docs', matchOptions())).toThrow(URIError);
    });
  });
});
