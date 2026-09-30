import { ContentComponentDefinition } from '@atlasng/content-templates';
import type { Heading } from '@atlasng/design-system/content/heading';
import { ContentSchemaLibrary } from './schema-library';

/**
 * Creates the `heading` definition for `Heading`. Content replaces the `tagline` fallback text.
 *
 * Config: `level` (number), and optional `id` and `tagline` (strings).
 *
 * @param s Schema library, e.g. zod's `z`.
 * @returns The definition.
 */
export function createHeadingDefinition(s: ContentSchemaLibrary): ContentComponentDefinition<Heading> {
  return {
    name: 'heading',
    component: () => import('@atlasng/design-system/content/heading').then((m) => m.Heading),
    config: {
      level: s.number(),
      id: s.string().optional(),
      tagline: s.string().optional(),
    },
    slots: { content: '*' },
    defaultSlot: 'content',
  };
}
