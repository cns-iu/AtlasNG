import { ContentDefinition } from '@atlasng/content-blocks/types';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonValue } from 'type-fest';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { checkUnknownConfigKeys, validateConfig } from './config';

const string: StandardSchemaV1<JsonValue | undefined, string> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] }),
  },
};

const definition: ContentDefinition = { name: 'card', component: class {}, config: { title: string } };

function element(config: Record<string, JsonValue>): RenderElementNode {
  return buildRenderTree({ version: 1, content: { component: 'card', config } })[0] as RenderElementNode;
}

describe('checkUnknownConfigKeys', () => {
  it('accepts declared keys', () => {
    expect(checkUnknownConfigKeys(element({ title: 'a' }), definition)).toEqual([]);
  });

  it('reports unknown keys', () => {
    expect(checkUnknownConfigKeys(element({ size: 1 }), definition)).toEqual([
      { message: "Unknown config key 'size'.", path: ['config', 'size'] },
    ]);
  });

  it('reports config for definitions without config', () => {
    expect(checkUnknownConfigKeys(element({ a: 1 }), { name: 'bare', component: class {} })).toEqual([
      { message: "Component 'bare' does not accept config.", path: ['config'] },
    ]);
  });

  it('leaves keys to a single schema for the whole config', () => {
    expect(checkUnknownConfigKeys(element({ size: 1 }), { ...definition, config: string as never })).toEqual([]);
  });
});

describe('validateConfig', () => {
  it('returns no outputs without a schema', async () => {
    await expect(validateConfig(undefined, { title: 'a' }, 'p')).resolves.toEqual({});
  });

  it('validates per-key schemas and ignores unknown keys', async () => {
    await expect(validateConfig(definition.config, { title: 'a', size: 1 }, 'p')).resolves.toEqual({ title: 'a' });
    await expect(validateConfig(definition.config, { title: 1 }, 'p')).rejects.toThrow(
      "Invalid content at 'p': config.title: Expected a string.",
    );
  });

  it('validates missing keys as undefined and omits undefined outputs', async () => {
    const optional: StandardSchemaV1<JsonValue | undefined, string | undefined> = {
      '~standard': { version: 1, vendor: 'test', validate: (value) => ({ value: value as string | undefined }) },
    };

    await expect(validateConfig({ title: optional }, {}, 'p')).resolves.toEqual({});
    await expect(validateConfig({ title: string }, undefined, 'p')).rejects.toThrow(
      "Invalid content at 'p': config.title: Expected a string.",
    );
  });

  it('validates the whole config with a single schema', async () => {
    const whole: StandardSchemaV1<JsonValue, object> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value) =>
          typeof value === 'object' && value !== null && 'title' in value
            ? { value: { ...value, extra: undefined } }
            : { issues: [{ message: 'Missing title.', path: ['title'] }] },
      },
    };

    await expect(validateConfig(whole, { title: 'a' }, 'p')).resolves.toEqual({ title: 'a' });
    await expect(validateConfig(whole, {}, 'p')).rejects.toThrow(
      "Invalid content at 'p': config.title: Missing title.",
    );
  });
});
