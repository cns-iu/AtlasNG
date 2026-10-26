import { boolean, headingLevel, oneOf, optional, string } from './schemas';

describe('schemas', () => {
  it('validate primitives, allowed values, and optional values', async () => {
    expect(await string()['~standard'].validate('a')).toEqual({ value: 'a' });
    expect(await string()['~standard'].validate(1)).toEqual({ issues: [{ message: 'Expected a string.' }] });
    expect(await boolean()['~standard'].validate(false)).toEqual({ value: false });
    expect(await oneOf(['a', 'b'])['~standard'].validate('c')).toEqual({
      issues: [{ message: 'Expected one of "a", "b".' }],
    });
    expect(await headingLevel()['~standard'].validate(6)).toEqual({ value: 6 });
    expect(await optional(string())['~standard'].validate(undefined)).toEqual({ value: undefined });
    expect(await optional(string())['~standard'].validate(1)).toEqual({ issues: [{ message: 'Expected a string.' }] });
  });
});
