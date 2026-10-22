import { Component, ErrorHandler, input, OnDestroy } from '@angular/core';
import {
  ContentDefinition,
  ContentDocument,
  ContentElementNode,
  DEFAULT_CONTENT,
} from '@atlasng/content-templates/types';
import { passthroughSchema } from '@atlasng/content-templates/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { render, screen, waitFor } from '@testing-library/angular';
import { BehaviorSubject, Subject } from 'rxjs';
import { JsonValue } from 'type-fest';
import { ContentTemplatesConfig } from '../config';
import { ContentTemplatesFeature, provideContentTemplates, withDataLoaders, withDefinitions } from '../providers';
import { ContentOutlet } from './content-outlet';

const string: StandardSchemaV1<JsonValue | undefined, string> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] }),
  },
};

// eslint-disable-next-line @angular-eslint/component-selector -- mirrors attribute-selector components like TextLink
@Component({ selector: 'a[angTestLink]', template: '<ng-content />' })
class Link {}

@Component({ selector: 'ang-test-paragraph', template: '<p><ng-content /></p>' })
class Paragraph {}

@Component({ selector: 'ang-test-heading', template: '<h2>{{ title() }}</h2>' })
class Heading implements OnDestroy {
  readonly title = input<string>();
  static destroyed = 0;

  ngOnDestroy(): void {
    Heading.destroyed++;
  }
}

@Component({
  selector: 'ang-test-card',
  template: '<section><h3><ng-content select="[slot=title]" /></h3><ng-content /></section>',
})
class Card {}

@Component({ selector: 'ang-test-panel', template: '<article><ng-content select="[panel-body]" /></article>' })
class Panel {}

@Component({
  selector: 'ang-test-list',
  template: '<ul>@for (row of rows(); track $index) { <li>{{ row }}</li> }</ul>',
})
class List {
  readonly rows = input<unknown[]>([]);
}

@Component({ selector: 'ang-test-placeholder', template: '<span>Loading {{ node().component }}</span>' })
class Placeholder {
  readonly node = input.required<ContentElementNode>();
}

@Component({
  selector: 'ang-test-error',
  template: '<span role="alert">{{ definition()?.name }}: {{ message() }}</span>',
})
class ErrorView {
  readonly error = input<unknown>();
  readonly definition = input<ContentDefinition>();

  message(): string {
    return this.error() instanceof Error ? (this.error() as Error).message : String(this.error());
  }
}

@Component({ selector: 'ang-test-text', template: '<em>{{ text() }}</em>' })
class Text {
  readonly text = input<string>();
}

@Component({ imports: [ContentOutlet], template: '<ang-content-outlet [document]="document()" />' })
class Host {
  readonly document = input.required<ContentDocument>();
}

const definitions: ContentDefinition[] = [
  { name: 'paragraph', component: Paragraph, content: { content: '*' } },
  { name: 'heading', component: Heading, config: { title: string } },
  { name: 'card', component: Card, content: { title: '[slot=title]', body: '*' } },
  {
    name: 'list',
    component: () => List,
    data: { rows: passthroughSchema() },
    placeholderComponent: Placeholder,
    errorComponent: ErrorView,
  },
  { name: 'eager-list', component: List, data: { rows: passthroughSchema() } },
  { name: 'link', component: Link, host: 'a', content: { content: '*' } },
  { name: 'panel', component: Panel, content: { body: '[panel-body]', [DEFAULT_CONTENT]: 'body' } },
  { name: 'broken-panel', component: Panel, content: { body: '[missing]' } },
];

function doc(content: ContentDocument['content']): ContentDocument {
  return { version: 1, content };
}

async function setup(
  document: ContentDocument,
  config: ContentTemplatesConfig = {},
  ...features: ContentTemplatesFeature[]
) {
  const errorHandler = { handleError: vi.fn() };
  const result = await render(Host, {
    inputs: { document },
    providers: [
      { provide: ErrorHandler, useValue: errorHandler },
      provideContentTemplates(config, withDefinitions(definitions), ...features),
    ],
  });
  return { ...result, errorHandler };
}

describe('ContentOutlet', () => {
  it('renders text and components with config and projected content', async () => {
    await setup(
      doc([
        { component: 'heading', config: { title: 'Overview' } },
        { component: 'paragraph', content: ['Read the ', { component: 'heading', config: { title: 'docs' } }, '.'] },
        'Tail',
      ]),
    );

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'docs' }).closest('p')).toHaveTextContent('Read the docs.');
    expect(screen.getByText('Tail', { exact: false })).toBeInTheDocument();
  });

  it('renders text with the configured text component', async () => {
    await setup(doc(['Hello']), { textComponent: Text });

    expect((await screen.findByText('Hello')).tagName).toBe('EM');
  });

  it('creates the host element named by the definition', async () => {
    await setup(doc({ component: 'link', content: 'Docs' }));

    expect((await screen.findByText('Docs')).tagName).toBe('A');
  });

  it('projects content by name and unkeyed content into the DEFAULT_CONTENT entry', async () => {
    await setup(
      doc([
        { component: 'card', content: { title: 'Sales', body: ['Body text'] } },
        { component: 'panel', content: 'Panel text' },
      ]),
    );

    const title = await screen.findByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Sales');
    expect(title.parentElement).toHaveTextContent('SalesBody text');
    expect(screen.getByText('Panel text').tagName).toBe('ARTICLE');
  });

  it('shows a placeholder until a boundary is ready without delaying the rest', async () => {
    const rows = new Subject<unknown[]>();
    await setup(
      doc([
        { component: 'heading', config: { title: 'Now' } },
        { component: 'list', data: { rows: { type: 'stream' } } },
      ]),
      {},
      withDataLoaders({ stream: () => ({ load: () => rows }) }),
    );

    expect(await screen.findByRole('heading', { name: 'Now' })).toBeInTheDocument();
    expect(await screen.findByText('Loading list')).toBeInTheDocument();

    rows.next(['a', 'b']);

    expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Loading list')).not.toBeInTheDocument();
    expect(screen.getByRole('list').closest('ang-content-boundary')).toHaveStyle({ display: 'contents' });
  });

  it('updates rendered data on later emissions and shows the error component on an invalid one', async () => {
    const rows = new BehaviorSubject<unknown>(['a']);
    const { errorHandler } = await setup(
      doc({ component: 'list', data: { rows: { type: 'stream' } } }),
      {},
      withDataLoaders({ stream: () => ({ load: () => rows }) }),
    );
    expect(await screen.findAllByRole('listitem')).toHaveLength(1);

    rows.next(['a', 'b', 'c']);
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(3));

    rows.error(new Error('Stream failed.'));
    expect(await screen.findByRole('alert')).toHaveTextContent('list: Stream failed.');
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('shows the definition error component when a boundary fails', async () => {
    const { errorHandler } = await setup(
      doc([
        { component: 'heading', config: { title: 'Still here' } },
        { component: 'list', data: { rows: { type: 'missing' } } },
      ]),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent("list: Invalid content at 'content.@default[1]'");
    expect(screen.getByRole('heading', { name: 'Still here' })).toBeInTheDocument();
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('stops the loads of a failed boundary', async () => {
    const rows = new Subject<unknown[]>();
    await setup(
      doc([
        { component: 'eager-list', data: { rows: { type: 'stream' } } },
        { component: 'heading', config: { title: 1 } },
      ]),
      { errorComponent: ErrorView },
      withDataLoaders({ stream: () => ({ load: () => rows }) }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Expected a string.');
    expect(rows.observed).toBe(false);
  });

  it('shows the configured error component when the root fails', async () => {
    const { errorHandler } = await setup(doc([{ component: 'heading', config: { title: 1 } }]), {
      errorComponent: async () => ({ default: ErrorView }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Expected a string.');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('reports structural document errors', async () => {
    await setup({ version: 2 as 1, content: [] }, { errorComponent: ErrorView });

    expect(await screen.findByRole('alert')).toHaveTextContent("Unsupported content document version '2'.");
  });

  it('renders nothing and reports the error without an error component', async () => {
    const { container, errorHandler } = await setup(doc({ component: 'missing' }));

    await waitFor(() => expect(errorHandler.handleError).toHaveBeenCalledTimes(1));
    expect(container.querySelector('ang-content-outlet')).toBeEmptyDOMElement();
  });

  it('reports errors of a failing error component', async () => {
    const { errorHandler } = await setup(doc({ component: 'missing' }), {
      errorComponent: () => class NotAComponent {},
    });

    await waitFor(() => expect(errorHandler.handleError).toHaveBeenCalledTimes(2));
  });

  it('fails in dev mode when the definition maps content to a selector the component lacks', async () => {
    await setup(doc({ component: 'broken-panel', content: { body: 'x' } }), { errorComponent: ErrorView });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Component 'broken-panel' has no ng-content for selector '[missing]'.",
    );
  });

  it('throws in dev mode when a default name is not registered', async () => {
    await expect(setup(doc([]), { defaultLoader: 'missing' })).rejects.toThrow(
      "Content templates config names unregistered entries: defaultLoader 'missing'.",
    );
  });

  it('replaces content and aborts pending loads when the document changes', async () => {
    const rows = new Subject<unknown[]>();
    const { fixture } = await setup(
      doc({ component: 'list', data: { rows: { type: 'stream' } } }),
      {},
      withDataLoaders({ stream: () => ({ load: () => rows }) }),
    );
    expect(await screen.findByText('Loading list')).toBeInTheDocument();

    fixture.componentRef.setInput('document', doc({ component: 'heading', config: { title: 'Next' } }));

    expect(await screen.findByRole('heading', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByText('Loading list')).not.toBeInTheDocument();
    expect(rows.observed).toBe(false);
  });

  it('destroys created components with the outlet', async () => {
    const { fixture } = await setup(
      doc({ component: 'paragraph', content: { component: 'heading', config: { title: 'a' } } }),
    );
    await screen.findByRole('heading');
    const destroyed = Heading.destroyed;

    fixture.destroy();

    expect(Heading.destroyed).toBe(destroyed + 1);
  });
});
