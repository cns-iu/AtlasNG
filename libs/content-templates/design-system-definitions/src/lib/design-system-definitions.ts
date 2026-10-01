import { ContentComponentDefinition } from '@atlasng/content-templates';
import { createContentHeaderDefinition } from './content-header-definition';
import { createContentParagraphDefinition } from './content-paragraph-definition';
import { createHeadingDefinition } from './heading-definition';
import { createLinkSnippetDefinition } from './link-snippet-definition';
import { ContentSchemaLibrary } from './schema-library';
import { createTextLinkDefinition } from './text-link-definition';

/**
 * Creates every design-system definition, e.g. for `withDefinitions(createDesignSystemDefinitions(z))`.
 * Components are loaded lazily on first use.
 *
 * @param s Schema library, e.g. zod's `z`.
 * @returns The definitions.
 */
export function createDesignSystemDefinitions(s: ContentSchemaLibrary): ContentComponentDefinition[] {
  return [
    createContentHeaderDefinition(s),
    createContentParagraphDefinition(),
    createHeadingDefinition(s),
    createLinkSnippetDefinition(s),
    createTextLinkDefinition(),
  ];
}
