import { describe, expect, it } from 'vitest';
import { formatOutputData, indent } from './output.ts';

describe('output utils', () => {
  describe('indent', () => {
    it('indents nested lines by one level', () => {
      expect(indent(['a', ['b', [1, true]]])).toEqual(['  a', '  b', '  1', '  true']);
    });

    it('indents by the given level', () => {
      expect(indent(['a'], 2)).toEqual(['    a']);
    });
  });

  describe('formatOutputData', () => {
    it('joins nested lines with newlines', () => {
      expect(formatOutputData(['a', ['b', indent(['c'])], ''])).toBe('a\nb\n  c\n');
    });

    it('joins with a custom separator', () => {
      expect(formatOutputData(['a', ['b']], ', ')).toBe('a, b');
    });
  });
});
