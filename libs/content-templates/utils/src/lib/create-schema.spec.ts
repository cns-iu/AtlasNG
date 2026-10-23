import { createSchema } from './create-schema';

describe('createSchema', () => {
  it('wraps a validate function as a Standard Schema', async () => {
    const schema = createSchema<number>((value) =>
      typeof value === 'number' ? { value } : { issues: [{ message: 'Expected a number.' }] },
    );

    expect(schema['~standard']).toMatchObject({ version: 1, vendor: 'atlasng' });
    expect(await schema['~standard'].validate(1)).toEqual({ value: 1 });
    expect(await schema['~standard'].validate('1')).toEqual({ issues: [{ message: 'Expected a number.' }] });
  });
});
