import { StandardSchemaV1 } from '@standard-schema/spec';
import { ContentDefinition } from '@atlasng/content-templates/types';
import { passthroughSchema } from '@atlasng/content-templates/utils';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { checkUnknownDataKeys, validateDataValue } from './data';

const definition: ContentDefinition = { name: 'table', component: class {}, data: { rows: passthroughSchema() } };

function element(data: Record<string, unknown[]>): RenderElementNode {
  return buildRenderTree({ version: 1, content: { component: 'table', data } })[0] as RenderElementNode;
}

describe('checkUnknownDataKeys', () => {
  it('accepts declared keys', () => {
    expect(checkUnknownDataKeys(element({ rows: [] }), definition)).toEqual([]);
  });

  it('reports unknown keys', () => {
    expect(checkUnknownDataKeys(element({ extra: [] }), definition)).toEqual([
      { message: "Unknown data key 'extra'.", path: ['data', 'extra'] },
    ]);
  });

  it('reports data for definitions without data', () => {
    expect(checkUnknownDataKeys(element({ rows: [] }), { name: 'bare', component: class {} })).toEqual([
      { message: "Component 'bare' does not accept data.", path: ['data'] },
    ]);
  });
});

describe('validateDataValue', () => {
  it('validates values and formats indexes in brackets', async () => {
    const rows: StandardSchemaV1<unknown> = {
      '~standard': { version: 1, vendor: 'test', validate: () => ({ issues: [{ message: 'Bad.', path: [0] }] }) },
    };

    await expect(validateDataValue(passthroughSchema(), 1, 'rows', 'p')).resolves.toBe(1);
    await expect(validateDataValue(rows, [], 'rows', 'p')).rejects.toThrow(
      "Invalid content at 'p': data.rows[0]: Bad.",
    );
  });
});
