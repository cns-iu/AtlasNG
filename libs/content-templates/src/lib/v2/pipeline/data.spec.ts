import { TestBed } from '@angular/core/testing';
import { DataLoaderRegistry, provideDataLoaders } from '@atlasng/content-templates/loaders';
import { DataParserRegistry } from '@atlasng/content-templates/parsers';
import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import { ContentDataSchema, ContentElementNode } from '@atlasng/content-templates/types';
import { passthroughSchema } from '@atlasng/content-templates/utils';
import { Subject } from 'rxjs';
import { CONTENT_TEMPLATES_CONFIG } from '../config';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { PipelineContext } from './context';
import { loadData } from './data';

function setup(loaders: Parameters<typeof provideDataLoaders>[0] = {}): PipelineContext {
  TestBed.configureTestingModule({ providers: [provideDataLoaders(loaders)] });
  return TestBed.runInInjectionContext(() => ({
    definitions: TestBed.inject(DefinitionRegistry),
    loaders: TestBed.inject(DataLoaderRegistry),
    parsers: TestBed.inject(DataParserRegistry),
    config: CONTENT_TEMPLATES_CONFIG.inject(),
  }));
}

function element(data: ContentElementNode['data'], signal?: AbortSignal): RenderElementNode {
  return buildRenderTree({ version: 1, content: { component: 'table', data } }, signal)[0] as RenderElementNode;
}

describe('loadData', () => {
  it('emits the initial value until the loader delivers', async () => {
    const values = new Subject<unknown>();
    const schemas: ContentDataSchema = { rows: { schema: passthroughSchema(), initialValue: () => ['initial'] } };
    const data = await loadData(
      element({ rows: { type: 'stream' } }),
      schemas,
      setup({ stream: () => ({ load: () => values }) }),
      () => undefined,
    );

    expect(data['rows']?.()).toEqual(['initial']);

    values.next(['loaded']);
    await vi.waitFor(() => expect(data['rows']?.()).toEqual(['loaded']));
  });

  it('does not validate initial values', async () => {
    const values = new Subject<unknown>();
    const reject: ContentDataSchema[string] = {
      schema: { '~standard': { version: 1, vendor: 'test', validate: () => ({ issues: [{ message: 'Invalid.' }] }) } },
      initialValue: 'initial',
    };
    const context = setup({ stream: () => ({ load: () => values }) });
    const data = await loadData(
      element({ loaded: { type: 'stream' } }),
      { loaded: reject, missing: reject },
      context,
      () => undefined,
    );

    expect(data['loaded']?.()).toBe('initial');
    expect(data['missing']?.()).toBe('initial');
  });

  it('does not load data for an aborted node', async () => {
    const load = vi.fn(() => new Subject<unknown>());
    const controller = new AbortController();
    controller.abort(new Error('aborted'));

    await expect(
      loadData(
        element({ rows: { type: 'stream' } }, controller.signal),
        { rows: passthroughSchema() },
        setup({ stream: () => ({ load }) }),
        () => undefined,
      ),
    ).rejects.toThrow('aborted');
    expect(load).not.toHaveBeenCalled();
  });

  it('rejects data values that are neither a string, an array, nor a data source', async () => {
    const node = element({ rows: { url: '/rows.json' } as never });

    await expect(loadData(node, { rows: passthroughSchema() }, setup(), () => undefined)).rejects.toThrow(
      'Expected a string, an array, or a data source with a string `type`.',
    );
  });

  it('rejects unknown data parsers', async () => {
    const node = element({ rows: { type: 'inline', value: [], parser: 'missing' } });

    await expect(loadData(node, { rows: passthroughSchema() }, setup(), () => undefined)).rejects.toThrow(
      "Unknown data parser 'missing'.",
    );
  });
});
