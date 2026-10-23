import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DefinitionRegistry, provideDefinitions } from '@atlasng/content-templates/definitions';
import { DataLoaderRegistry, provideDataLoaders } from '@atlasng/content-templates/loaders';
import { DataParserRegistry, provideDataParsers } from '@atlasng/content-templates/parsers';
import { ContentDefinition, ContentDocument, DEFAULT_CONTENT } from '@atlasng/content-templates/types';
import { ContentValidationError, passthroughSchema } from '@atlasng/content-templates/utils';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { BehaviorSubject, Subject } from 'rxjs';
import { JsonValue } from 'type-fest';
import { CONTENT_TEMPLATES_CONFIG } from '../config';
import { PipelineContext } from './context';
import { startPipeline } from './pipeline';

@Component({ template: '' })
class TestComponent {
  readonly title = input<unknown>();
  readonly rows = input<unknown>();
}

const stringSchema: StandardSchemaV1<JsonValue | undefined, string> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] }),
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}

function setup(
  definitions: Record<string, () => ContentDefinition | Promise<ContentDefinition>>,
  providers: Parameters<typeof TestBed.configureTestingModule>[0]['providers'] = [],
): PipelineContext {
  TestBed.configureTestingModule({ providers: [provideDefinitions(definitions), ...(providers ?? [])] });
  return TestBed.runInInjectionContext(() => ({
    definitions: TestBed.inject(DefinitionRegistry),
    loaders: TestBed.inject(DataLoaderRegistry),
    parsers: TestBed.inject(DataParserRegistry),
    config: CONTENT_TEMPLATES_CONFIG.inject(),
  }));
}

function start(content: ContentDocument['content'], context: PipelineContext, signal?: AbortSignal) {
  const nodes = buildRenderTree({ version: 1, content }, signal);
  startPipeline(nodes, context);
  return nodes as RenderElementNode[];
}

describe('startPipeline', () => {
  const card: ContentDefinition = { name: 'card', component: TestComponent, content: { body: '*' } };
  const leaf: ContentDefinition = { name: 'leaf', component: TestComponent };

  it('loads every definition at once and releases children once the parent is checked', async () => {
    const cardLoad = deferred<ContentDefinition>();
    const leafLoad = vi.fn(() => leaf);
    const context = setup({ card: () => cardLoad.promise, leaf: leafLoad });

    const [root] = start({ component: 'card', content: { component: 'leaf' } }, context);
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

  it('does not start nodes of an aborted tree', () => {
    const controller = new AbortController();
    controller.abort();
    const [root] = start({ component: 'leaf' }, setup({ leaf: () => leaf }), controller.signal);

    expect(root.definition).toBeUndefined();
  });

  it('drops all content of a definition without content in prod mode', async () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      const [root] = start(
        { component: 'leaf', content: ['text', { component: 'leaf' }] },
        setup({ leaf: () => leaf }),
      );
      await root.definition;

      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Component 'leaf' does not accept content."));
      expect(root.children).toEqual([]);
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

  describe('resolving', () => {
    const table: ContentDefinition = {
      name: 'table',
      component: TestComponent,
      config: { title: stringSchema },
      data: { rows: passthroughSchema() },
    };

    it('resolves the component, config, and data', async () => {
      const [root] = start(
        { component: 'table', config: { title: 'Sales' }, data: { rows: [1, 2] } },
        setup({ table: () => table }),
      );

      const resolved = await root.resolved;
      expect(resolved?.component).toBe(TestComponent);
      expect(resolved?.config).toEqual({ title: 'Sales' });
      expect(resolved?.data['rows']?.()).toEqual([1, 2]);
    });

    it('applies the default loader, parser, and data defaults', async () => {
      const load = vi.fn((config: unknown) => config);
      const parse = vi.fn((value: unknown) => value);
      const withDefault: ContentDefinition = {
        ...table,
        config: undefined,
        data: { rows: { schema: passthroughSchema(), initialValue: () => ['fallback'] }, title: passthroughSchema() },
      };
      const [root] = start(
        { component: 'table', data: { title: '/title.json' } },
        setup({ table: () => withDefault }, [
          provideDataLoaders({ http: () => ({ load }) }),
          provideDataParsers({ passthrough: () => ({ parse }) }),
        ]),
      );

      const resolved = await root.resolved;
      expect(load).toHaveBeenCalledWith({ url: '/title.json' }, expect.anything());
      expect(parse).toHaveBeenCalledWith({ url: '/title.json' }, {}, expect.anything());
      expect(resolved?.data['rows']?.()).toEqual(['fallback']);
    });

    it('updates data signals on later emissions and fails the node on an invalid one', async () => {
      const values = new BehaviorSubject<unknown>('first');
      const definition: ContentDefinition = { ...table, config: undefined, data: { rows: stringSchema } };
      const [root] = start(
        { component: 'table', data: { rows: { type: 'stream' } } },
        setup({ table: () => definition }, [provideDataLoaders({ stream: () => ({ load: () => values }) })]),
      );

      const rows = (await root.resolved)?.data['rows'];
      expect(rows?.()).toBe('first');

      values.next('second');
      await vi.waitFor(() => expect(rows?.()).toBe('second'));

      values.next(42);
      await vi.waitFor(() => expect(root.error()).toBeInstanceOf(ContentValidationError));
      expect(rows?.()).toBe('second');
    });

    it('rejects invalid config and unknown loaders', async () => {
      const [invalid, unknown] = start(
        [
          { component: 'table', config: { title: 1 } },
          { component: 'table', config: { title: 'x' }, data: { rows: { type: 'missing' } } },
        ],
        setup({ table: () => table }),
      );

      await expect(invalid?.resolved).rejects.toThrow('Expected a string.');
      await expect(unknown?.resolved).rejects.toThrow("Unknown data loader 'missing'.");
      expect(unknown?.error()).toBeInstanceOf(ContentValidationError);
    });

    it("does not copy a failed parent's error to its children", async () => {
      const parent: ContentDefinition = { ...table, content: { body: '*' } };
      const [root] = start(
        { component: 'table', config: { title: 1 }, content: { component: 'leaf' } },
        setup({ table: () => parent, leaf: () => leaf }),
      );
      const [child] = root.elementChildren;

      await expect(root.resolved).rejects.toThrow('Expected a string.');
      await Promise.allSettled([child?.definition, child?.resolved]);

      expect(child?.abortSignal.reason).toBe(root.error());
      expect(child?.error()).toBeUndefined();
    });

    it('rejects keys without a component input in dev mode', async () => {
      const definition: ContentDefinition = { ...table, config: { subtitle: stringSchema } };
      const [root] = start({ component: 'table', config: { subtitle: 'x' } }, setup({ table: () => definition }));

      await expect(root.resolved).rejects.toThrow("Component 'table' has no input 'subtitle' for config.");
    });

    it('rejects keys used by both config and data in dev mode', async () => {
      const definition: ContentDefinition = { ...table, data: { title: passthroughSchema() } };
      const [root] = start(
        { component: 'table', config: { title: 'x' }, data: { title: ['y'] } },
        setup({ table: () => definition }),
      );

      await expect(root.resolved).rejects.toThrow("Component 'table' uses input 'title' for both config and data.");
    });

    it('stops loading data when the node aborts', async () => {
      const values = new Subject<unknown>();
      const controller = new AbortController();
      const [root] = start(
        { component: 'table', data: { rows: { type: 'stream' } } },
        setup({ table: () => ({ ...table, config: undefined }) }, [
          provideDataLoaders({ stream: () => ({ load: () => values }) }),
        ]),
        controller.signal,
      );
      await root.definition;
      await vi.waitFor(() => expect(values.observed).toBe(true));

      controller.abort(new Error('aborted'));

      await expect(root.resolved).rejects.toThrow('aborted');
      expect(values.observed).toBe(false);
      expect(root.error()).toBeUndefined();
    });
  });
});
