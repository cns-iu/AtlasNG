import { ContentProjectionSchema, DEFAULT_CONTENT } from '@atlasng/content-blocks/types';
import { getContentName, getContentSelector, getContentSlot, getDefaultContentName } from './projection';

describe('projection', () => {
  const catchAll: ContentProjectionSchema = { title: '[slot=title]', body: '*' };
  const named: ContentProjectionSchema = { body: '[panel-body]', [DEFAULT_CONTENT]: 'body' };

  it('finds the default entry by DEFAULT_CONTENT or the catch-all selector', () => {
    expect(getDefaultContentName(catchAll)).toBe('body');
    expect(getDefaultContentName(named)).toBe('body');
    expect(getDefaultContentName({ title: '[slot=title]' })).toBeUndefined();
  });

  it('resolves content keys to entry names and selectors', () => {
    expect(getContentName(catchAll, DEFAULT_CONTENT)).toBe('body');
    expect(getContentName(catchAll, 'title')).toBe('title');
    expect(getContentSelector(named, DEFAULT_CONTENT)).toBe('[panel-body]');
    expect(getContentSelector(catchAll, 'missing')).toBeUndefined();
    expect(getContentSelector({}, DEFAULT_CONTENT)).toBeUndefined();
  });

  it('finds the slot index of content keys', () => {
    const selectors = ['[slot=title]', '*'];

    expect(getContentSlot(catchAll, selectors, 'title')).toBe(0);
    expect(getContentSlot(catchAll, selectors, DEFAULT_CONTENT)).toBe(1);
    expect(getContentSlot(named, selectors, 'body')).toBe(-1);
    expect(getContentSlot(catchAll, selectors, 'missing')).toBe(-1);
  });
});
