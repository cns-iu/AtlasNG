import { DEFAULT_CONTENT } from '@atlasng/content-blocks/types';
import { buildRenderTree } from './build-tree';
import { isRenderElementNode, isRenderTextNode, RenderElementNode, RenderNodeLocation } from './render-node';

describe('RenderElementNode', () => {
  function build(): RenderElementNode {
    const [node] = buildRenderTree({
      version: 1,
      content: { component: 'card', content: { title: 'Sales', body: [{ component: 'table' }, 'note'] } },
    });
    return node as RenderElementNode;
  }

  it('lists children and element children in content order, including unkeyed content', () => {
    const [root] = buildRenderTree({
      version: 1,
      content: { component: 'list', content: ['a', { component: 'item' }] },
    }) as [RenderElementNode];

    expect(root.children.map((child) => child.kind)).toEqual(['text', 'element']);
    expect(root.elementChildren).toEqual([root.content[DEFAULT_CONTENT]?.[1]]);
  });

  it('reflects removed content in its children', () => {
    const node = build();
    delete node.content['body'];

    expect(node.children.map((child) => child.key)).toEqual(['title']);
    expect(node.elementChildren).toEqual([]);
  });

  it('narrows nodes by kind', () => {
    const children = build().children;

    expect(children.map(isRenderTextNode)).toEqual([true, false, true]);
    expect(children.map(isRenderElementNode)).toEqual([false, true, false]);
  });
});

describe('RenderNodeLocation', () => {
  it('formats paths of positions without a node', () => {
    expect(new RenderNodeLocation(null, DEFAULT_CONTENT, 2).path).toBe('content.@default[2]');
    expect(new RenderNodeLocation(null, 'title').path).toBe('content.title');
  });
});
