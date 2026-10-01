import { ContentComponentDefinition } from '@atlasng/content-templates';
import type { ContentParagraph } from '@atlasng/design-system/content/content-paragraph';

/**
 * Creates the `content-paragraph` definition for `ContentParagraph`. Content is projected into the paragraph.
 *
 * Takes no schema library, since the paragraph has no config or data; the signature matches the other definitions.
 *
 * @returns The definition.
 */
export function createContentParagraphDefinition(): ContentComponentDefinition<ContentParagraph> {
  return {
    name: 'content-paragraph',
    component: () => import('@atlasng/design-system/content/content-paragraph').then((m) => m.ContentParagraph),
    slots: { content: '*' },
    defaultSlot: 'content',
  };
}
