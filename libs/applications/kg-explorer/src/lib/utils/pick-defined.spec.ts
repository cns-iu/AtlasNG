import { pickDefined } from './pick-defined';

describe('pickDefined', () => {
  it('drops undefined properties and keeps other falsy values', () => {
    expect(pickDefined({ a: undefined, b: false, c: 0, d: '', e: null })).toEqual({ b: false, c: 0, d: '', e: null });
  });
});
