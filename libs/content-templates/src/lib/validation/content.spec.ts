import { ContentDefinition, ContentElementNode } from '@atlasng/content-templates/types';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { checkUnknownContentKeys } from './content';

const definition: ContentDefinition = {
  name: 'card',
  component: class {},
  content: { body: '*', actions: '[actions]' },
};

function element(content: ContentElementNode['content']): RenderElementNode {
  return buildRenderTree({ version: 1, content: { component: 'card', content } })[0] as RenderElementNode;
}

function messages(node: RenderElementNode, nodeDefinition: ContentDefinition): string[] {
  return checkUnknownContentKeys(node, nodeDefinition).map((issue) => issue.message);
}

describe('checkUnknownContentKeys', () => {
  it('accepts declared names and default content', () => {
    expect(checkUnknownContentKeys(element('x'), definition)).toEqual([]);
    expect(checkUnknownContentKeys(element({ actions: 'x' }), definition)).toEqual([]);
  });

  it('reports unknown content names', () => {
    expect(checkUnknownContentKeys(element({ footer: 'x' }), definition)).toEqual([
      { message: "Unknown content key 'footer'.", path: ['content', 'footer'] },
    ]);
  });

  it('reports content for definitions without content', () => {
    expect(messages(element('x'), { name: 'bare', component: class {} })).toEqual([
      "Component 'bare' does not accept content.",
    ]);
  });

  it('reports unkeyed content without a default entry', () => {
    expect(messages(element('x'), { ...definition, content: { actions: '[actions]' } })).toEqual([
      "Component 'card' has no default content.",
    ]);
  });
});
