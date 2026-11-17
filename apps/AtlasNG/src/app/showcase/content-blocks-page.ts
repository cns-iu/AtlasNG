import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { ContentBlock, provideContentBlocks, withDefinitions } from '@atlasng/content-blocks';
import { DESIGN_SYSTEM_DEFINITIONS } from '@atlasng/content-blocks/definitions/design-system';
import { ContentDocument } from '@atlasng/content-blocks/types';

/** Document rendered by the content block. */
const DOCUMENT: ContentDocument = {
  version: 1,
  content: [
    { component: 'ContentHeader', config: { tagline: 'Content blocks', level: 1, id: 'top' } },
    {
      component: 'ContentParagraph',
      content: [
        'Rendered from a JSON document with a ',
        { component: 'TextLink', config: { href: 'https://github.com/cns-iu/AtlasNG' }, content: 'text link' },
        '.',
      ],
    },
    {
      component: 'Notice',
      config: { variant: 'info', tagline: 'Notice' },
      content: 'Notices, links and headings come from the design-system definitions.',
    },
  ],
};

/**
 * Showcase page for `@atlasng/content-blocks`.
 */
@Component({
  selector: 'ang-content-blocks-page',
  imports: [ContentBlock],
  template: `<ang-content-block [document]="document" />`,
})
export class ContentBlocksPage {
  /** Rendered document. */
  protected readonly document = DOCUMENT;
}

/** Routes of the content blocks page, which registers the design-system definitions. */
export const CONTENT_BLOCKS_ROUTES: Routes = [
  {
    path: '',
    component: ContentBlocksPage,
    providers: [provideContentBlocks({}, withDefinitions(DESIGN_SYSTEM_DEFINITIONS))],
  },
];
