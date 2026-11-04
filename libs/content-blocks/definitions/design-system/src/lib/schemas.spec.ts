import {
  arrayable,
  arrayOf,
  boolean,
  headingLevel,
  link,
  number,
  object,
  oneOf,
  optional,
  record,
  string,
  tableColumn,
  tableRows,
  youTubePlayerVars,
} from './schemas';

describe('schemas', () => {
  it('validate primitives, allowed values, and optional values', async () => {
    expect(await string()['~standard'].validate('a')).toEqual({ value: 'a' });
    expect(await string()['~standard'].validate(1)).toEqual({ issues: [{ message: 'Expected a string.' }] });
    expect(await boolean()['~standard'].validate(false)).toEqual({ value: false });
    expect(await number()['~standard'].validate(1.5)).toEqual({ value: 1.5 });
    expect(await number()['~standard'].validate('1')).toEqual({ issues: [{ message: 'Expected a number.' }] });
    expect(await oneOf(['a', 'b'])['~standard'].validate('c')).toEqual({
      issues: [{ message: 'Expected one of "a", "b".' }],
    });
    expect(await headingLevel()['~standard'].validate(6)).toEqual({ value: 6 });
    expect(await optional(string())['~standard'].validate(undefined)).toEqual({ value: undefined });
    expect(await optional(string())['~standard'].validate(1)).toEqual({ issues: [{ message: 'Expected a string.' }] });
  });

  it('validate arrays, records, and objects with item paths', async () => {
    expect(await arrayOf(string())['~standard'].validate(['a'])).toEqual({ value: ['a'] });
    expect(await arrayOf(string())['~standard'].validate('a')).toEqual({ issues: [{ message: 'Expected an array.' }] });
    expect(await arrayOf(string())['~standard'].validate(['a', 1])).toEqual({
      issues: [{ message: 'Expected a string.', path: [1] }],
    });
    expect(await arrayable(string())['~standard'].validate('a')).toEqual({ value: 'a' });
    expect(await arrayable(string())['~standard'].validate(['a'])).toEqual({ value: ['a'] });
    expect(await record(number())['~standard'].validate({ a: 1 })).toEqual({ value: { a: 1 } });
    expect(await record(number())['~standard'].validate([])).toEqual({ issues: [{ message: 'Expected an object.' }] });
    expect(await record(number())['~standard'].validate({ a: 'x' })).toEqual({
      issues: [{ message: 'Expected a number.', path: ['a'] }],
    });

    const schema = object({ a: string(), b: optional(number()) });
    expect(await schema['~standard'].validate({ a: 'x' })).toEqual({ value: { a: 'x' } });
    expect(await schema['~standard'].validate(null)).toEqual({ issues: [{ message: 'Expected an object.' }] });
    expect(await schema['~standard'].validate({ b: 1, c: true })).toEqual({
      issues: [
        { message: "Unknown key 'c'.", path: ['c'] },
        { message: 'Expected a string.', path: ['a'] },
      ],
    });
  });

  it('validate links', async () => {
    const schema = link()['~standard'];
    const command = { command: ['/people', 1], queryParams: { tab: 'bio', ids: [1, 2], old: null }, fragment: 'top' };

    expect(await schema.validate('https://example.com')).toEqual({ value: 'https://example.com' });
    expect(await schema.validate(['/people', 1])).toEqual({ value: ['/people', 1] });
    expect(await schema.validate(command)).toEqual({ value: command });
    expect(await schema.validate(1)).toEqual({
      issues: [{ message: 'Expected a string or an array of path segments.' }],
    });
    expect(await schema.validate(['/people', true])).toEqual({
      issues: [{ message: 'Expected a string or a number.', path: [1] }],
    });
    expect(await schema.validate({ command: '/a', queryParams: { a: {} }, queryParamsHandling: 'keep' })).toEqual({
      issues: [
        { message: 'Expected a string, number, boolean, or null.', path: ['queryParams', 'a'] },
        { message: 'Expected one of "merge", "preserve", "replace".', path: ['queryParamsHandling'] },
      ],
    });
  });

  it('validate table columns and rows', async () => {
    const column = tableColumn()['~standard'];

    expect(await column.validate({ prop: 'url', type: 'link', labelProp: 'name' })).toEqual({
      value: { prop: 'url', type: 'link', labelProp: 'name' },
    });
    expect(await column.validate({ prop: 'url', type: 'link', label: 'a', labelProp: 'b' })).toEqual({
      issues: [{ message: 'Expected only one of label and labelProp.', path: ['labelProp'] }],
    });
    expect(await column.validate({ type: 'list' })).toEqual({
      issues: [
        { message: 'Expected a string.', path: ['prop'] },
        { message: 'Expected one of "text", "number", "code", "chip", "link".', path: ['type'] },
      ],
    });
    expect(await tableRows()['~standard'].validate([{ a: 1 }])).toEqual({ value: [{ a: 1 }] });
    expect(await tableRows()['~standard'].validate([1])).toEqual({
      issues: [{ message: 'Expected an array of objects.' }],
    });
  });

  it('validate youtube player vars', async () => {
    const schema = youTubePlayerVars()['~standard'];

    expect(await schema.validate({ autoplay: 1, hl: 'en', iv_load_policy: 3 })).toEqual({
      value: { autoplay: 1, hl: 'en', iv_load_policy: 3 },
    });
    expect(await schema.validate({ autoplay: true, origin: 'x' })).toEqual({
      issues: [
        { message: "Unknown key 'origin'.", path: ['origin'] },
        { message: 'Expected one of 0, 1.', path: ['autoplay'] },
      ],
    });
  });
});
