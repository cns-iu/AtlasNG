import { Component } from '@angular/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonObject } from 'type-fest';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentValidationError } from './errors';
import { validateConfig, validateData } from './validation';

@Component({ selector: 'ang-test', template: '' })
class TestComponent {}

function schema<TInput = unknown, TOutput = unknown>(
  validate: (value: unknown) => StandardSchemaV1.Result<TOutput> | Promise<StandardSchemaV1.Result<TOutput>>,
): StandardSchemaV1<TInput, TOutput> {
  return { '~standard': { version: 1, vendor: 'test', validate } };
}

const string = schema<string, string>((value) =>
  typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] },
);
const optionalString = schema<string | undefined, string | undefined>((value) =>
  value === undefined || typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] },
);
const asyncUppercase = schema<string, string>(async (value) => ({ value: String(value).toUpperCase() }));

function definition(overrides: Partial<ContentComponentDefinition> = {}): ContentComponentDefinition {
  return { name: 'test', component: TestComponent, ...overrides };
}

async function validationError(promise: Promise<unknown>): Promise<ContentValidationError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ContentValidationError);
  return error as ContentValidationError;
}

describe('validateConfig', () => {
  it('accepts a missing or empty config without a schema', async () => {
    await expect(validateConfig(definition(), { component: 'test' }, 'content.0')).resolves.toEqual({});
    await expect(validateConfig(definition(), { component: 'test', config: {} }, 'content.0')).resolves.toEqual({});
  });

  it('rejects config without a schema', async () => {
    const error = await validationError(
      validateConfig(definition(), { component: 'test', config: { a: 1 } }, 'content.0'),
    );

    expect(error.path).toBe('content.0');
    expect(error.issues).toEqual([{ message: "Component 'test' does not accept config.", path: ['config'] }]);
  });

  it('validates the whole config with an object schema', async () => {
    const objectSchema = schema<JsonObject, object>((value) =>
      typeof (value as JsonObject)['title'] === 'string'
        ? { value: { ...(value as JsonObject), extra: undefined } }
        : { issues: [{ message: 'Expected a string.', path: ['title'] }] },
    );

    await expect(
      validateConfig(definition({ config: objectSchema }), { component: 'test', config: { title: 'a' } }, 'p'),
    ).resolves.toEqual({ title: 'a' });

    const error = await validationError(
      validateConfig(definition({ config: objectSchema }), { component: 'test' }, 'p'),
    );
    expect(error.issues).toEqual([{ message: 'Expected a string.', path: ['config', 'title'] }]);
    expect(error.message).toBe("Invalid content at 'p': config.title: Expected a string.");
  });

  it('validates each key with a per-key schema record and reports all issues', async () => {
    const config = { title: string, subtitle: optionalString, level: asyncUppercase };

    await expect(
      validateConfig(definition({ config }), { component: 'test', config: { title: 'a', level: 'h2' } }, 'p'),
    ).resolves.toEqual({ title: 'a', level: 'H2' });

    const error = await validationError(
      validateConfig(definition({ config }), { component: 'test', config: { title: 1, other: true } }, 'p'),
    );
    expect(error.issues).toEqual([
      { message: "Unknown config key 'other'.", path: ['config', 'other'] },
      { message: 'Expected a string.', path: ['config', 'title'] },
    ]);
  });
});

describe('validateData', () => {
  it('accepts no data without a schema', async () => {
    await expect(validateData(definition(), {}, 'p')).resolves.toEqual({});
  });

  it('rejects data without a schema', async () => {
    const error = await validationError(validateData(definition(), { rows: Promise.resolve([]) }, 'p'));

    expect(error.issues).toEqual([{ message: "Component 'test' does not accept data.", path: ['data'] }]);
  });

  it('validates loaded values, applies defaults, and skips any', async () => {
    const data = {
      title: string,
      columns: { schema: string, defaultValue: 'default' },
      raw: 'any' as const,
      loose: { schema: 'any' as const },
      optional: optionalString,
    };

    await expect(
      validateData(definition({ data }), { title: Promise.resolve('a'), raw: Promise.resolve(1) }, 'p'),
    ).resolves.toEqual({ title: 'a', columns: 'default', raw: 1 });
  });

  it('validates undefined for missing keys without a default', async () => {
    const error = await validationError(validateData(definition({ data: { title: string } }), {}, 'p'));

    expect(error.issues).toEqual([{ message: 'Expected a string.', path: ['data', 'title'] }]);
  });

  it('reports unknown keys', async () => {
    const error = await validationError(
      validateData(definition({ data: { title: optionalString } }), { other: Promise.resolve(1) }, 'p'),
    );

    expect(error.issues).toEqual([{ message: "Unknown data key 'other'.", path: ['data', 'other'] }]);
  });

  it('rejects with load errors', async () => {
    await expect(
      validateData(definition({ data: { rows: 'any' } }), { rows: Promise.reject(new Error('offline')) }, 'p'),
    ).rejects.toThrow('offline');
  });
});
