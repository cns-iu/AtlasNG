import { ContentDocument, DEFAULT_CONTENT } from '@atlasng/content-templates/types';
import { buildRenderTree } from './build-tree';
import { RenderElementNode, RenderNode, RenderTextNode } from './render-node';

function doc(content: ContentDocument['content']): ContentDocument {
  return { version: 1, content };
}

describe('buildRenderTree', () => {
  it('builds text, default content, and named content', () => {
    const [text, card, list] = buildRenderTree(
      doc([
        'Hello',
        { component: 'card', content: { title: 'Sales', body: [{ component: 'table' }] } },
        { component: 'list', content: ['a', 'b'] },
      ]),
    ) as [RenderNode, RenderElementNode, RenderElementNode];

    expect(text).toBeInstanceOf(RenderTextNode);
    expect(text).toMatchObject({
      index: 0,
      key: DEFAULT_CONTENT,
      parent: null,
      text: 'Hello',
      path: 'content.@default[0]',
    });
    expect(card.content['title']?.[0]).toMatchObject({ kind: 'text', index: undefined, key: 'title', parent: card });
    expect(card.content['title']?.[0].path).toBe('content.@default[1].content.title');
    expect(card.content['body']?.[0]).toBeInstanceOf(RenderElementNode);
    expect(card.content['body']?.[0].path).toBe('content.@default[1].content.body[0]');
    expect(list.content[DEFAULT_CONTENT]?.[1].path).toBe('content.@default[2].content.@default[1]');
  });

  it('aborts descendants with the document signal', () => {
    const controller = new AbortController();
    const [outer] = buildRenderTree(doc({ component: 'a', content: { component: 'b' } }), controller.signal) as [
      RenderElementNode,
    ];
    const inner = outer.content[DEFAULT_CONTENT]?.[0] as RenderElementNode;

    controller.abort('changed');

    expect(outer.abortController.signal.reason).toBe('changed');
    expect(inner.abortController.signal.reason).toBe('changed');
  });

  it('rejects unsupported versions and invalid nodes', () => {
    expect(() => buildRenderTree({ version: 2 as 1, content: [] })).toThrow(
      "Unsupported content document version '2'.",
    );
    expect(() => buildRenderTree(doc({ component: 'a', content: { body: [42 as unknown as string] } }))).toThrow(
      "Invalid content at 'content.@default.content.body[0]': Expected a string or an object with a string `component`.",
    );
  });
});
