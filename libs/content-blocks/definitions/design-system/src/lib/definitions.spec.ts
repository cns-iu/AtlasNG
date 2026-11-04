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
  await waitFor(() => expect(fixture.componentInstance.rendered).toHaveBeenCalled(), { timeout: 5000 });
  return { errorHandler };
}

describe('design-system definitions', () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it('render cards with links and actions', async () => {
    const { errorHandler } = await setup([
      {
        component: 'BasicProfileCard',
        config: {
          image: 'ada.png',
          name: 'Ada Lovelace',
          description: ['Mathematician', 'Writer'],
          link: { command: ['/people', 'ada'], fragment: 'bio' },
        },
      },
      {
        component: 'BrandProfileCard',
        config: { image: 'grace.png', name: 'Grace Hopper', description: 'Computer scientist', centered: true },
        content: { actions: { component: 'TextLink', config: { href: '/people/grace' }, content: 'Profile' } },
      },
    ]);

    expect(screen.getByRole('link', { name: 'Ada Lovelace' })).toHaveAttribute('href', '/people/ada#bio');
    expect(screen.getByText('Writer')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/people/grace');
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });

  it('render a table from JSON columns and rows', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );
    const { errorHandler } = await setup({
      component: 'Table',
      config: {
        appearance: 'grid',
        rowHeight: 40,
        columns: [
          { prop: 'name', name: 'Name' },
          { prop: 'score', name: 'Score', type: 'number' },
          { prop: 'id', name: 'ID', type: 'code', sortable: false },
          { prop: 'tags', name: 'Tags', type: 'chip', minWidth: 200 },
          { prop: 'profile', name: 'Profile', type: 'link', label: 'View' },
          { prop: 'site', name: 'Site', type: 'link', align: 'center', flexGrow: 2 },
        ],
      },
      data: {
        rows: [{ name: 'Ada', score: 1234.5, id: 'ada', tags: ['Math'], profile: '/ada', site: 'https://ada.dev' }],
      },
    });

    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('1,234.5')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View' })).toHaveAttribute('href', '/ada');
    expect(screen.getByRole('link', { name: 'https://ada.dev' })).toHaveAttribute('href', 'https://ada.dev/');
    expect(errorHandler.handleError).not.toHaveBeenCalled();
  });

  it('render a youtube player placeholder', async () => {
    const { errorHandler } = await setup({
      component: 'YouTubePlayer',
      config: {
        videoId: 'pzUFmDhQEO8',
        width: 320,
        height: 180,
        startSeconds: 5,
        suggestedQuality: 'hd720',
        playerVars: { autoplay: 1, mute: 1, controls: 2, color: 'white', start: 5 },
        placeholderButtonLabel: 'Play intro',
        placeholderImageQuality: 'low',
      },
      content: { enableRequest: 'Accept marketing cookies to watch.' },
    });

    expect(screen.getByRole('link', { name: 'Play intro' })).toBeInTheDocument();
    expect(screen.getByText('Accept marketing cookies to watch.')).toBeInTheDocument();
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

  it('reject invalid nested config with its path', async () => {
    const errorHandler = { handleError: vi.fn() };
    await render(Host, {
      inputs: {
        document: {
          version: 1,
          content: { component: 'Table', config: { columns: [{ prop: 'name', label: 'Name' }] } },
        },
      },
      providers: [
        { provide: ErrorHandler, useValue: errorHandler },
        provideContentBlocks({}, withDefinitions(DESIGN_SYSTEM_DEFINITIONS)),
      ],
    });

    await waitFor(() =>
      expect(errorHandler.handleError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('config.columns[0].label: Only link columns accept a label.'),
        }),
      ),
    );
  });
});
