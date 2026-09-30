import { ContentComponentDefinition } from '@atlasng/content-templates';
import type { ContentHeader } from '@atlasng/design-system/content/content-header';
import { ContentSchemaLibrary } from './schema-library';

/**
 * Creates the `content-header` definition for `ContentHeader`.
 *
 * Config: `tagline` (string), `level` (number), and optional `id` (string) and `underlined` (boolean).
 *
 * @param s Schema library, e.g. zod's `z`.
 * @returns The definition.
 */
export function createContentHeaderDefinition(s: ContentSchemaLibrary): ContentComponentDefinition<ContentHeader> {
  return {
    name: 'content-header',
    component: () => import('@atlasng/design-system/content/content-header').then((m) => m.ContentHeader),
    config: {
      tagline: s.string(),
      level: s.number(),
      id: s.string().optional(),
      underlined: s.boolean().optional(),
    },
  };
}
