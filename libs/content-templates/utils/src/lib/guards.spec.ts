import { isContentDataSource, isContentElementNode, isNamedContentRecord, isPlainObject } from './guards';

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
    expect(isNamedContentRecord({ title: 'Sales' })).toBe(true);
    expect(isNamedContentRecord({ component: 'card' })).toBe(false);
    expect(isNamedContentRecord(['a'])).toBe(false);
    expect(isNamedContentRecord('a')).toBe(false);
  });
});
