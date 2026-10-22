import { isContentDataSource, isContentElementNode, isNamedContent, isPlainObject } from './guards';

describe('guards', () => {
  it('recognizes plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(null)).toBe(false);
  });

  it('recognizes element nodes by a string component', () => {
    expect(isContentElementNode({ component: 'card' })).toBe(true);
    expect(isContentElementNode({ component: 1 })).toBe(false);
    expect(isContentElementNode('card')).toBe(false);
  });

  it('recognizes data sources by a string type', () => {
    expect(isContentDataSource({ type: 'http', url: '/rows.json' })).toBe(true);
    expect(isContentDataSource({ url: '/rows.json' })).toBe(false);
    expect(isContentDataSource([])).toBe(false);
  });

  it('tells named content from nodes and node lists', () => {
    expect(isNamedContent({ title: 'Sales' })).toBe(true);
    expect(isNamedContent({ component: 'card' })).toBe(false);
    expect(isNamedContent(['a'])).toBe(false);
    expect(isNamedContent('a')).toBe(false);
  });
});
