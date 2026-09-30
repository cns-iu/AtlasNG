import { Component, ErrorHandler, input, OnDestroy } from '@angular/core';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { render, screen, waitFor } from '@testing-library/angular';
import { Subject } from 'rxjs';
import {
  ContentTemplatesFeature,
  provideContentTemplates,
  withDataLoaders,
  withDefinitions,
  withRendererConfig,
} from '../registry/providers';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentDocument, ContentElementNode } from '../types/content-document';
import { ContentRenderer } from './content-renderer';

const string: StandardSchemaV1<string, string> = {
  '~standard': {
    version: 1,
    vendor: 'test',
    validate: (value) => (typeof value === 'string' ? { value } : { issues: [{ message: 'Expected a string.' }] }),
  },
};

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
  readonly definition = input<ContentComponentDefinition>();

  message(): string {
    return this.error() instanceof Error ? (this.error() as Error).message : String(this.error());
  }
}

@Component({ selector: 'ang-test-plain-error', template: '<span role="alert">Failed</span>' })
class PlainError {}

const definitions: ContentComponentDefinition[] = [
  { name: 'paragraph', component: Paragraph, slots: { content: '*' }, defaultSlot: 'content' },
  { name: 'heading', component: Heading, config: { title: string } },
  { name: 'card', component: Card, slots: { title: '[slot=title]', body: '*' }, defaultSlot: 'body' },
  { name: 'list', component: () => List, data: { rows: 'any' }, placeholder: Placeholder, error: ErrorView },
  { name: 'eager-list', component: List, data: { rows: 'any' } },
];

function doc(content: ContentDocument['content']): ContentDocument {
  return { version: 1, content };
}

async function setup(document: ContentDocument, ...features: ContentTemplatesFeature[]) {
  const errorHandler = { handleError: vi.fn() };
  const result = await render(ContentRenderer, {
    inputs: { document },
    providers: [
      { provide: ErrorHandler, useValue: errorHandler },
      provideContentTemplates(withDefinitions(definitions), ...features),
    ],
  });
  return { ...result, errorHandler };
}

describe('ContentRenderer', () => {
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

  it('projects content into named slots', async () => {
    await setup(doc({ component: 'card', content: { title: 'Sales', body: ['Body text'] } }));

    const title = await screen.findByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Sales');
    expect(title).not.toHaveTextContent('Body text');
    expect(title.parentElement).toHaveTextContent('SalesBody text');
  });

  it('shows a placeholder until a boundary is ready without delaying the rest', async () => {
    const rows = new Subject<unknown[]>();
    await setup(
      doc([
        { component: 'heading', config: { title: 'Now' } },
        { component: 'list', data: { rows: { loader: 'stream' } } },
      ]),
      withDataLoaders({ stream: () => ({ load: () => rows }) }),
    );

    expect(await screen.findByRole('heading', { name: 'Now' })).toBeInTheDocument();
    expect(await screen.findByText('Loading list')).toBeInTheDocument();

    rows.next(['a', 'b']);

    expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Loading list')).not.toBeInTheDocument();
    expect(screen.getByRole('list').closest('ang-content-outlet')).toHaveStyle({ display: 'contents' });
  });

  it('shows the definition error component when a boundary fails', async () => {
    const { errorHandler } = await setup(
      doc([
        { component: 'heading', config: { title: 'Still here' } },
        { component: 'list', data: { rows: { loader: 'missing' } } },
      ]),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent("list: Unknown data loader 'missing'.");
    expect(screen.getByRole('heading', { name: 'Still here' })).toBeInTheDocument();
    expect(errorHandler.handleError).toHaveBeenCalledWith(new Error("Unknown data loader 'missing'."));
  });

  it('shows the configured error component when the root fails', async () => {
    await setup(
      doc([{ component: 'heading', config: { title: 1 } as never }]),
      withRendererConfig({ errorComponent: async () => ({ default: PlainError }) }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('reports structural document errors', async () => {
    const { errorHandler } = await setup(
      { version: 2 as 1, content: [] },
      withRendererConfig({ errorComponent: ErrorView }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent("Unsupported content document version '2'.");
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('renders nothing and reports the error without an error component', async () => {
    const { container, errorHandler } = await setup(doc({ component: 'missing' }));

    await waitFor(() => expect(errorHandler.handleError).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('reports errors of a failing error component', async () => {
    const { errorHandler } = await setup(
      doc({ component: 'missing' }),
      withRendererConfig({ errorComponent: () => class NotAComponent {} }),
    );

    await waitFor(() => expect(errorHandler.handleError).toHaveBeenCalledTimes(2));
  });

  it('fails in dev mode for content without a default slot', async () => {
    const { errorHandler } = await setup(
      doc([{ component: 'eager-list', data: { rows: [] }, content: 'x' }]),
      withRendererConfig({ errorComponent: ErrorView }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Component 'eager-list' cannot project content without a default slot.",
    );
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });

  it('fails in dev mode for unknown slots', async () => {
    await setup(
      doc({ component: 'card', content: { footer: 'x' } }),
      withRendererConfig({ errorComponent: ErrorView }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Component 'card' cannot project content into slot 'footer'.",
    );
  });

  it('drops content for unknown slots in prod mode', async () => {
    const global = globalThis as Record<string, unknown>;
    const originalNgDevMode = global['ngDevMode'];
    global['ngDevMode'] = false;
    try {
      await setup(doc({ component: 'card', content: { title: 'Sales', footer: 'Dropped' } }));

      expect(await screen.findByRole('heading', { level: 3 })).toHaveTextContent('Sales');
      expect(screen.queryByText('Dropped')).not.toBeInTheDocument();
    } finally {
      global['ngDevMode'] = originalNgDevMode;
    }
  });

  it('replaces content and aborts pending loads when the document changes', async () => {
    const rows = new Subject<unknown[]>();
    const { fixture } = await setup(
      doc({ component: 'list', data: { rows: { loader: 'stream' } } }),
      withDataLoaders({ stream: () => ({ load: () => rows }) }),
    );
    expect(await screen.findByText('Loading list')).toBeInTheDocument();

    fixture.componentRef.setInput('document', doc({ component: 'heading', config: { title: 'Next' } }));

    expect(await screen.findByRole('heading', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByText('Loading list')).not.toBeInTheDocument();
    expect(rows.observed).toBe(false);
  });

  it('destroys created components with the renderer', async () => {
    const { fixture } = await setup(
      doc({ component: 'paragraph', content: { component: 'heading', config: { title: 'a' } } }),
    );
    await screen.findByRole('heading');
    const destroyed = Heading.destroyed;

    fixture.destroy();

    expect(Heading.destroyed).toBe(destroyed + 1);
  });
});
