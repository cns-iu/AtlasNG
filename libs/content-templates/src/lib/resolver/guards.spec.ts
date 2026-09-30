import { isContentDataSource, isContentElementNode, isContentSlots } from './guards';

describe('isContentElementNode', () => {
  it('accepts objects with a string component', () => {
    expect(isContentElementNode({ component: 'a' })).toBe(true);
  });

  it('rejects other values', () => {
    expect(isContentElementNode('a')).toBe(false);
    expect(isContentElementNode(null)).toBe(false);
    expect(isContentElementNode([{ component: 'a' }])).toBe(false);
    expect(isContentElementNode({ component: 1 })).toBe(false);
  });
});

describe('isContentDataSource', () => {
  it('accepts objects with a loader', () => {
    expect(isContentDataSource({ loader: 'http' })).toBe(true);
  });

  it('rejects other values', () => {
    expect(isContentDataSource('http')).toBe(false);
    expect(isContentDataSource([])).toBe(false);
    expect(isContentDataSource({ parser: 'csv' })).toBe(false);
  });
});

describe('isContentSlots', () => {
  it('distinguishes slot records from nodes and node lists', () => {
    expect(isContentSlots({ title: 'Title' })).toBe(true);
    expect(isContentSlots({ component: 'a' })).toBe(false);
    expect(isContentSlots(['a'])).toBe(false);
    expect(isContentSlots('a')).toBe(false);
  });
});
