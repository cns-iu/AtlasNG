import { TestBed } from '@angular/core/testing';
import { DataLoaderRegistry, provideDataLoaders } from '@atlasng/content-blocks/loaders';
import { DataParserRegistry, provideDataParsers } from '@atlasng/content-blocks/parsers';
import { DefinitionRegistry } from '@atlasng/content-blocks/definitions';
import { ContentDataSchema, ContentElementNode } from '@atlasng/content-blocks/types';
import { createSchema, passthroughSchema } from '@atlasng/content-blocks/utils';
import { EMPTY, Subject, throwError } from 'rxjs';
import { CONTENT_BLOCKS_CONFIG } from '../config';
import { buildRenderTree } from '../nodes/build-tree';
import { RenderElementNode } from '../nodes/render-node';
import { PipelineContext } from './context';
import { loadData } from './data';

function setup(loaders: Parameters<typeof provideDataLoaders>[0] = {}): PipelineContext {
  TestBed.configureTestingModule({ providers: [provideDataLoaders(loaders)] });
  return createContext();
}

function createContext(): PipelineContext {
  return TestBed.runInInjectionContext(() => ({
    definitions: TestBed.inject(DefinitionRegistry),
    loaders: TestBed.inject(DataLoaderRegistry),
    parsers: TestBed.inject(DataParserRegistry),
    config: CONTENT_BLOCKS_CONFIG.inject(),
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

  it('uses a non-function initial value for a missing key', async () => {
    const data = await loadData(
      element({}),
      { rows: { schema: passthroughSchema(), initialValue: ['initial'] } },
      setup(),
      () => undefined,
    );

    expect(data['rows']?.()).toEqual(['initial']);
  });

  it('applies parsers given in object form', async () => {
    const node = element({ rows: { type: 'inline', value: '[1, 2]', parser: { type: 'json' } } });
    const data = await loadData(node, { rows: passthroughSchema() }, setup(), () => undefined);

    expect(data['rows']?.()).toEqual([1, 2]);
  });

  it('validates undefined for a missing key without an initial value', async () => {
    const schemas: ContentDataSchema = { rows: { schema: passthroughSchema() } };
    const data = await loadData(element({}), schemas, setup(), () => undefined);

    expect(data['rows']?.()).toBeUndefined();
  });

  it('rejects with the error of a loader that fails before its first value', async () => {
    const node = element({ rows: { type: 'failing' } });
    const context = setup({ failing: () => ({ load: () => throwError(() => new Error('Load failed.')) }) });

    await expect(loadData(node, { rows: passthroughSchema() }, context, () => undefined)).rejects.toThrow(
      'Load failed.',
    );
  });

  it('rejects loaders that complete without a value', async () => {
    const node = element({ rows: { type: 'empty' } });

    await expect(
      loadData(node, { rows: passthroughSchema() }, setup({ empty: () => ({ load: () => EMPTY }) }), () => undefined),
    ).rejects.toThrow("Data 'rows' completed without a value.");
  });

  it('validates loader and parser config with their schemas and passes the output on', async () => {
    const load = vi.fn((config: { url: string; retries: number }) => config.url);
    const parse = vi.fn((input: unknown, config: { upper: boolean }) =>
      config.upper ? String(input).toUpperCase() : input,
    );
    const loaderSchema = createSchema<{ url: string; retries: number }>((value) => ({
      value: { ...(value as { url: string }), retries: 3 },
    }));
    const parserSchema = createSchema<{ upper: boolean }>(() => ({ value: { upper: true } }));
    TestBed.configureTestingModule({
      providers: [
        provideDataLoaders({ custom: () => ({ configSchema: loaderSchema, load }) }),
        provideDataParsers({ custom: () => ({ configSchema: parserSchema, parse }) }),
      ],
    });
    const node = element({ rows: { type: 'custom', url: '/rows', parser: { type: 'custom' } } });

    const data = await loadData(node, { rows: passthroughSchema() }, createContext(), () => undefined);

    expect(data['rows']?.()).toBe('/ROWS');
    expect(load).toHaveBeenCalledWith({ url: '/rows', retries: 3 }, expect.anything());
    expect(parse).toHaveBeenCalledWith('/rows', { upper: true }, expect.anything());
  });

  it('rejects invalid loader and parser config with issues under the data key', async () => {
    const invalid = createSchema(() => ({ issues: [{ message: 'Bad.', path: ['url'] }] }));
    TestBed.configureTestingModule({
      providers: [
        provideDataLoaders({ strict: () => ({ configSchema: invalid, load: () => 'loaded' }) }),
        provideDataParsers({ strict: () => ({ configSchema: invalid, parse: (input: unknown) => input }) }),
      ],
    });

    await expect(
      loadData(
        element({ rows: { type: 'strict', url: 1 } }),
        { rows: passthroughSchema() },
        createContext(),
        () => undefined,
      ),
    ).rejects.toThrow("Invalid content at 'content.@default': data.rows.url: Bad.");
    await expect(
      loadData(
        element({ rows: { type: 'inline', value: 1, parser: 'strict' } }),
        { rows: passthroughSchema() },
        createContext(),
        () => undefined,
      ),
    ).rejects.toThrow("Invalid content at 'content.@default': data.rows.parser.url: Bad.");
  });

  it('rejects unknown data parsers', async () => {
    const node = element({ rows: { type: 'inline', value: [], parser: 'missing' } });

    await expect(loadData(node, { rows: passthroughSchema() }, setup(), () => undefined)).rejects.toThrow(
      "Unknown data parser 'missing'.",
    );
  });
});
