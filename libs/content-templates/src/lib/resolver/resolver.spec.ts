import { Component, inject, InjectionToken } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { of, Subject } from 'rxjs';
import {
  ContentTemplatesFeature,
  provideContentTemplates,
  withDataLoaders,
  withDataParsers,
  withDefinitions,
  withLazyDefinitions,
} from '../registry/providers';
import { ContentDataLoader } from '../types/content-data';
import { ContentDocument } from '../types/content-document';
import { ContentValidationError } from './errors';
import { ResolvedContentElement } from './resolved-content';
import { ContentResolver } from './resolver';

@Component({ selector: 'ang-test', template: '' })
class TestComponent {}

const string: StandardSchemaV1<string, string> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] }),
  },
};

const LOG = new InjectionToken<string[]>('LOG');

function setup(...features: ContentTemplatesFeature[]): ContentResolver {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOG, useValue: [] },
      provideContentTemplates(
        withDefinitions([
          { name: 'text', component: TestComponent, config: { title: string } },
          { name: 'table', component: async () => ({ default: TestComponent }), data: { rows: 'any', label: 'any' } },
        ]),
        ...features,
      ),
    ],
  });
  return TestBed.inject(ContentResolver);
}

function doc(content: ContentDocument['content']): ContentDocument {
  return { version: 1, content };
}

const signal = new AbortController().signal;

describe('ContentResolver', () => {
  it('resolves text and element nodes with paths', async () => {
    const resolver = setup();
    const [text, element] = resolver.resolve(doc(['Hello', { component: 'text', config: { title: 'a' } }]), signal);

    expect(text).toEqual({ kind: 'text', path: 'content.0', text: 'Hello' });
    expect(element).toMatchObject({ kind: 'element', path: 'content.1', node: { component: 'text' } });

    const resolved = element as ResolvedContentElement;
    await expect(resolved.ready).resolves.toBeUndefined();
    await expect(resolved.component).resolves.toBe(TestComponent);
    await expect(resolved.config).resolves.toEqual({ title: 'a' });
    await expect(resolved.data).resolves.toEqual({});
  });

  it('accepts a single top-level node', () => {
    const resolver = setup();

    expect(resolver.resolve(doc('Hello'), signal)).toEqual([{ kind: 'text', path: 'content.0', text: 'Hello' }]);
  });

  it('resolves default and slot content recursively', () => {
    const resolver = setup();
    const [first, second] = resolver.resolve(
      doc([
        { component: 'text', content: ['a', { component: 'text' }] },
        { component: 'text', content: { title: 'b', body: [{ component: 'text' }] } },
      ]),
      signal,
    ) as ResolvedContentElement[];

    expect(first.defaultContent.map((node) => node.path)).toEqual(['content.0.content.0', 'content.0.content.1']);
    expect(first.slotContent).toEqual({});
    expect(second.defaultContent).toEqual([]);
    expect(second.slotContent['title']).toEqual([{ kind: 'text', path: 'content.1.content.title.0', text: 'b' }]);
    expect(second.slotContent['body'][0].path).toBe('content.1.content.body.0');
  });

  it('resolves a single element as default content', () => {
    const resolver = setup();
    const [element] = resolver.resolve(doc({ component: 'text', content: { component: 'text' } }), signal);

    expect((element as ResolvedContentElement).defaultContent[0].path).toBe('content.0.content.0');
  });

  it('throws for unsupported versions and invalid nodes', () => {
    const resolver = setup();

    expect(() => resolver.resolve({ version: 2 as 1, content: [] }, signal)).toThrow(ContentValidationError);
    expect(() => resolver.resolve(doc([42 as unknown as string]), signal)).toThrow(
      "Invalid content at 'content.0': Expected a string or an object with a string `component`.",
    );
  });

  it('rejects unknown definitions and invalid config', async () => {
    const resolver = setup();
    const [unknown, invalid] = resolver.resolve(
      doc([{ component: 'missing' }, { component: 'text', config: { title: 1 } }]),
      signal,
    ) as ResolvedContentElement[];

    await expect(unknown.ready).rejects.toThrow("Unknown component definition 'missing'.");
    await expect(invalid.ready).rejects.toThrow(ContentValidationError);
  });

  it('starts loading children before their parents are ready', () => {
    const load = vi.fn(() => new Promise<never>(() => undefined));
    const resolver = setup(withLazyDefinitions({ lazy: load }));

    resolver.resolve(doc({ component: 'lazy', content: { component: 'text', data: { rows: [] } } }), signal);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('loads inline, default-loader, and source data, passing configs as is', async () => {
    const loads: unknown[] = [];
    const loader: ContentDataLoader<{ type: string; url?: string }> = {
      load: (config, context) => {
        loads.push(config);
        expect(context.node.component).toBe('table');
        return of(`loaded:${String(config.url)}`);
      },
    };
    const resolver = setup(
      withDataLoaders({ http: () => loader }, { defaultLoader: 'http' }),
      withDataParsers({
        upper: () => ({
          parse: (input, config) => `${String(input).toUpperCase()}:${String(config['type'])}`,
        }),
      }),
    );
    const source = { type: 'http', url: 'b' };
    const [inline, byString, bySource] = resolver.resolve(
      doc([
        { component: 'table', data: { rows: [1, 2] } },
        { component: 'table', data: { rows: 'a' } },
        { component: 'table', data: { rows: { loader: source, parser: 'upper' }, label: { loader: 'http' } } },
      ]),
      signal,
    ) as ResolvedContentElement[];

    await expect(inline.data).resolves.toEqual({ rows: [1, 2] });
    await expect(byString.data).resolves.toEqual({ rows: 'loaded:a' });
    await expect(bySource.data).resolves.toEqual({ rows: 'LOADED:B:upper', label: 'loaded:undefined' });
    expect(loads).toContainEqual({ type: 'http', url: 'a' });
    expect(loads).toContain(source);
    expect(loads).toContainEqual({ type: 'http' });
  });

  it('rejects string data without a default loader', async () => {
    const resolver = setup();
    const [element] = resolver.resolve(doc({ component: 'table', data: { rows: 'a' } }), signal);

    await expect((element as ResolvedContentElement).data).rejects.toThrow(
      "No default data loader is configured for data 'rows' at 'content.0'.",
    );
  });

  it('rejects invalid data values and unknown loaders', async () => {
    const resolver = setup();
    const [invalid, unknown] = resolver.resolve(
      doc([
        { component: 'table', data: { rows: { url: 'x' } as never } },
        { component: 'table', data: { rows: { loader: 'missing' } } },
      ]),
      signal,
    ) as ResolvedContentElement[];

    await expect(invalid.data).rejects.toThrow("Invalid content at 'content.0': data.rows: Expected a string");
    await expect(unknown.data).rejects.toThrow("Unknown data loader 'missing'.");
  });

  it('aborts pending observable loads', async () => {
    const subject = new Subject<unknown>();
    const controller = new AbortController();
    const resolver = setup(withDataLoaders({ stream: () => ({ load: () => subject }) }));
    const [element] = resolver.resolve(
      doc({ component: 'table', data: { rows: { loader: 'stream' } } }),
      controller.signal,
    );

    await Promise.resolve();
    controller.abort(new Error('aborted'));

    await expect((element as ResolvedContentElement).data).rejects.toThrow('aborted');
    expect(subject.observed).toBe(false);
  });

  it('uses the injector of the registries for loader factories', async () => {
    const resolver = setup(
      withDataLoaders({
        log: () => {
          const log = inject(LOG);
          return {
            load: () => {
              log.push('load');
              return log;
            },
          };
        },
      }),
    );
    const [element] = resolver.resolve(doc({ component: 'table', data: { rows: { loader: 'log' } } }), signal);

    await expect((element as ResolvedContentElement).data).resolves.toEqual({ rows: ['load'] });
  });
});
