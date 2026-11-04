import { isStandardSchema, prefixIssues } from './standard-schema';

const props = { version: 1, vendor: 'test', validate: (value: unknown) => ({ value }) } as const;

describe('isStandardSchema', () => {
  it('accepts objects and functions with a ~standard property', () => {
    expect(isStandardSchema({ '~standard': props })).toBe(true);
    expect(isStandardSchema(Object.assign(() => undefined, { '~standard': props }))).toBe(true);
  });

  it('rejects other values', () => {
    expect(isStandardSchema(undefined)).toBe(false);
    expect(isStandardSchema('~standard')).toBe(false);
    expect(isStandardSchema({ title: props })).toBe(false);
  });
});

describe('prefixIssues', () => {
  it('prepends path segments', () => {
    expect(prefixIssues([{ message: 'a', path: [0] }, { message: 'b' }], ['data', 'rows'])).toEqual([
      { message: 'a', path: ['data', 'rows', 0] },
      { message: 'b', path: ['data', 'rows'] },
    ]);
  });
});
