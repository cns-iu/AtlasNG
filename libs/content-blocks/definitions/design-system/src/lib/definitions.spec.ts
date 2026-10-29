import { Component, ErrorHandler, input } from '@angular/core';
import { ContentBlock, provideContentBlocks, withDefinitions } from '@atlasng/content-blocks';
import { ContentDocument } from '@atlasng/content-blocks/types';
import { render, screen, waitFor } from '@testing-library/angular';
import { DESIGN_SYSTEM_DEFINITIONS } from './definitions';

@Component({
  imports: [ContentBlock],
  template: '<ang-content-block [document]="document()" (rendered)="rendered()" />',
})
class Host {
  readonly document = input.required<ContentDocument>();
  readonly rendered = vi.fn();
}

async function setup(content: ContentDocument['content']) {
  const errorHandler = { handleError: vi.fn() };
  const { fixture } = await render(Host, {
    inputs: { document: { version: 1, content } },
    providers: [
      { provide: ErrorHandler, useValue: errorHandler },
      provideContentBlocks({}, withDefinitions(DESIGN_SYSTEM_DEFINITIONS)),
    ],
  });
  await waitFor(() => expect(fixture.componentInstance.rendered).toHaveBeenCalled());
  return { errorHandler };
}

describe('design-system definitions', () => {
  it('render every component with its config and content', async () => {
    const { errorHandler } = await setup([
      { component: 'ContentHeader', config: { tagline: 'Overview', level: 2, id: 'overview' } },
      {
        component: 'ContentSection',
        config: { tagline: 'Getting started', level: 2, underlined: false },
        content: {
          content: [
            { component: 'Heading', config: { level: 3 }, content: 'Install' },
            {
              component: 'ContentParagraph',
              content: ['Read the ', { component: 'TextLink', config: { href: '/docs' }, content: 'docs' }, '.'],
            },
            { component: 'Notice', config: { variant: 'warning', tagline: 'Heads up' }, content: 'Requires Node 22.' },
            { component: 'LinkSnippet', config: { url: 'https://example.com/install' } },
          ],
        },
      },
    ]);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Install' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('href', '/docs');
    expect(screen.getByText('Requires Node 22.')).toBeInTheDocument();
    expect(screen.getByText('example.com/install')).toBeInTheDocument();
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });

  it('reject invalid config', async () => {
    const errorHandler = { handleError: vi.fn() };
    await render(Host, {
      inputs: { document: { version: 1, content: { component: 'Heading', config: { level: 7 } } } },
      providers: [
        { provide: ErrorHandler, useValue: errorHandler },
        provideContentBlocks({}, withDefinitions(DESIGN_SYSTEM_DEFINITIONS)),
      ],
    });

    await waitFor(() =>
      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('config.level: Expected one of 1, 2, 3, 4, 5, 6.'),
        }),
      ),
    );
  });
});
