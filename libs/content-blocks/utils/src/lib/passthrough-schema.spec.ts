import { passthroughSchema } from './passthrough-schema';

describe('passthroughSchema', () => {
  it('accepts any value as is', () => {
    const value = { rows: [1] };
    const schema = passthroughSchema();

    expect(schema['~standard'].validate(value)).toEqual({ value });
    expect(schema['~standard'].validate(undefined)).toEqual({ value: undefined });
  });

  it('returns a shared instance', () => {
    expect(passthroughSchema<string>()).toBe(passthroughSchema<number>());
  });
});
