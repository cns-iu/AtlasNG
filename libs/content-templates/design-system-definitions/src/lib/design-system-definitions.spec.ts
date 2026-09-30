import { Component, ErrorHandler, input } from '@angular/core';
import {
  ContentDocument,
  ContentRenderer,
  provideContentTemplates,
  withDefinitions,
  withRendererConfig,
} from '@atlasng/content-templates';
import { render, screen } from '@testing-library/angular';
import { z } from 'zod';
import { createDesignSystemDefinitions } from './design-system-definitions';
import { ContentSchemaLibrary } from './schema-library';

@Component({ selector: 'ang-test-error', template: '<span role="alert">{{ message() }}</span>' })
class ErrorView {
  readonly error = input<unknown>();

  message(): string {
    return this.error() instanceof Error ? (this.error() as Error).message : String(this.error());
  }
}

async function setup(content: ContentDocument['content']) {
  const errorHandler = { handleError: vi.fn() };
  await render(ContentRenderer, {
    inputs: { document: { version: 1, content } },
    providers: [
      { provide: ErrorHandler, useValue: errorHandler },
      provideContentTemplates(
        withDefinitions(createDesignSystemDefinitions(z)),
        withRendererConfig({ errorComponent: ErrorView }),
      ),
    ],
  });
  return { errorHandler };
}

describe('createDesignSystemDefinitions', () => {
  it('accepts zod as the schema library', () => {
    const library: ContentSchemaLibrary = z;

    expect(createDesignSystemDefinitions(library).map((definition) => definition.name)).toEqual([
      'content-header',
      'content-paragraph',
      'heading',
      'link-snippet',
      'text-link',
    ]);
  });

  it('renders headings, paragraphs, and text links', async () => {
    await setup([
      { component: 'heading', config: { level: 2 }, content: 'Overview' },
      { component: 'heading', config: { level: 3, tagline: 'Fallback' } },
      { component: 'content-paragraph', content: ['Read the ', { component: 'text-link', content: 'docs' }, '.'] },
    ]);

    expect(await screen.findByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Fallback' })).toBeInTheDocument();
    const link = screen.getByText('docs').closest('a');
    expect(link).toHaveClass('ang-text-link');
    expect(link?.closest('p')).toHaveTextContent('Read the docs.');
  });

  it('renders content headers and link snippets', async () => {
    await setup([
      { component: 'content-header', config: { tagline: 'Summary', level: 2, id: 'summary' } },
      { component: 'link-snippet', config: { url: 'https://example.com/page' } },
    ]);

    expect(await screen.findByRole('heading', { level: 2, name: /Summary/ })).toBeInTheDocument();
    expect(screen.getByText('example.com/page')).toBeInTheDocument();
  });

  it('validates config with the schema library', async () => {
    const { errorHandler } = await setup({ component: 'content-header', config: { tagline: 'Summary', level: 'two' } });

    expect(await screen.findByRole('alert')).toHaveTextContent("Invalid content at 'content.0': config.level:");
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
  });
});
