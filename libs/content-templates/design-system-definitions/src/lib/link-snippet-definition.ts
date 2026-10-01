import { ContentComponentDefinition } from '@atlasng/content-templates';
import type { LinkSnippet } from '@atlasng/design-system/links/link-snippet';
import { ContentSchemaLibrary } from './schema-library';

/**
 * Creates the `link-snippet` definition for `LinkSnippet`.
 *
 * Config: `url` (string).
 *
 * @param s Schema library, e.g. zod's `z`.
 * @returns The definition.
 */
export function createLinkSnippetDefinition(s: ContentSchemaLibrary): ContentComponentDefinition<LinkSnippet> {
  return {
    name: 'link-snippet',
    component: () => import('@atlasng/design-system/links/link-snippet').then((m) => m.LinkSnippet),
    config: { url: s.string() },
  };
}
