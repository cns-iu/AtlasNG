import { TestBed } from '@angular/core/testing';
import { DefinitionRegistry, provideDefinitions } from '@atlasng/content-templates/definitions';
import { ContentDefinition, ContentDocument, DEFAULT_CONTENT } from '@atlasng/content-templates/types';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { ContentValidationError } from '../validation/errors';
import { startPipeline } from './pipeline';

class TestComponent {}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}

function setup(definitions: Record<string, () => ContentDefinition | Promise<ContentDefinition>>): DefinitionRegistry {
  TestBed.configureTestingModule({ providers: [provideDefinitions(definitions)] });
  return TestBed.inject(DefinitionRegistry);
}

function start(content: ContentDocument['content'], registry: DefinitionRegistry, signal?: AbortSignal) {
  const nodes = buildRenderTree({ version: 1, content }, signal);
  startPipeline(nodes, registry);
  return nodes as RenderElementNode[];
}

describe('startPipeline', () => {
  const card: ContentDefinition = { name: 'card', component: TestComponent, content: { body: '*' } };
  const leaf: ContentDefinition = { name: 'leaf', component: TestComponent };

  it('loads every definition at once and releases children once the parent is checked', async () => {
    const cardLoad = deferred<ContentDefinition>();
    const leafLoad = vi.fn(() => leaf);
    const registry = setup({ card: () => cardLoad.promise, leaf: leafLoad });

    const [root] = start({ component: 'card', content: { component: 'leaf' } }, registry);
    const child = root.content[DEFAULT_CONTENT]?.[0] as RenderElementNode;

    expect(leafLoad).toHaveBeenCalledTimes(1);
    expect(child.definition).toBeUndefined();

    cardLoad.resolve(card);
    await expect(root.definition).resolves.toBe(card);
    await vi.waitFor(() => expect(child.definition).toBeDefined());
    await expect(child.definition).resolves.toBe(leaf);
  });

  it('rejects unknown definitions', async () => {
    const [root] = start({ component: 'missing' }, setup({}));

    await expect(root.definition).rejects.toThrow("Unknown component definition 'missing'.");
  });

  it('rejects unknown keys in dev mode without releasing children', async () => {
    const leafLoad = vi.fn(() => leaf);
    const [root] = start(
      { component: 'leaf', data: { rows: [] }, content: { component: 'leaf' } },
      setup({ leaf: leafLoad }),
    );
    const child = root.content[DEFAULT_CONTENT]?.[0] as RenderElementNode;

    await expect(root.definition).rejects.toBeInstanceOf(ContentValidationError);
    expect(child.definition).toBeUndefined();
  });

  it('drops unknown content with a warning in prod mode', async () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      const [root] = start(
        { component: 'card', content: { body: { component: 'leaf' }, footer: { component: 'leaf' } } },
        setup({ card: () => card, leaf: () => leaf }),
      );
      const [body, footer] = root.elementChildren;
      await root.definition;

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Unknown content key 'footer'."));
      expect(root.elementChildren).toEqual([body]);
      await vi.waitFor(() => expect(body?.definition).toBeDefined());
      expect(footer?.definition).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
      warn.mockRestore();
    }
  });

  it('does not release children of aborted nodes', async () => {
    const controller = new AbortController();
    const [root] = start(
      { component: 'card', content: { component: 'leaf' } },
      setup({ card: () => card, leaf: () => leaf }),
      controller.signal,
    );
    controller.abort();
    await root.definition;
    await Promise.resolve();

    expect((root.content[DEFAULT_CONTENT]?.[0] as RenderElementNode).definition).toBeUndefined();
  });
});
