import { ContentDefinition } from '@atlasng/content-templates/types';
import { boolean, headingLevel, oneOf, optional, string } from './schemas';

/**
 * `ContentHeader`: `ContentHeader`, a section header without content.
 *
 * Config: `tagline` and `level` (1-6), and optional `id` and `underlined`.
 */
export const CONTENT_HEADER_DEFINITION = {
  name: 'ContentHeader',
  component: () => import('@atlasng/design-system/content/content-header').then((m) => m.ContentHeader),
  config: {
    tagline: string(),
    level: headingLevel(),
    id: optional(string()),
    underlined: optional(boolean()),
  },
} satisfies ContentDefinition;

/** `ContentParagraph`: `ContentParagraph`, a paragraph of projected content, e.g. text and links. */
export const CONTENT_PARAGRAPH_DEFINITION = {
  name: 'ContentParagraph',
  component: () => import('@atlasng/design-system/content/content-paragraph').then((m) => m.ContentParagraph),
  content: {
    content: '*',
  },
} satisfies ContentDefinition;

/**
 * `ContentSection`: `ContentSection`, a titled section of projected content.
 *
 * Config: `title` and `level` (1-6), and optional `id` and `underlined`. Content: unkeyed content is the section body,
 * and `header` is shown next to the title.
 */
export const CONTENT_SECTION_DEFINITION = {
  name: 'ContentSection',
  component: () => import('@atlasng/design-system/content/content-section').then((m) => m.ContentSection),
  config: {
    title: string(),
    level: headingLevel(),
    id: optional(string()),
    underlined: optional(boolean()),
  },
  content: {
    content: '*',
    header: '[angContentSectionHeader]',
  },
} satisfies ContentDefinition;

/**
 * `Heading`: `Heading`, a heading whose content replaces the `tagline` fallback text.
 *
 * Config: `level` (1-6), and optional `id` and `tagline`.
 */
export const HEADING_DEFINITION = {
  name: 'Heading',
  component: () => import('@atlasng/design-system/content/heading').then((m) => m.Heading),
  config: {
    level: headingLevel(),
    id: optional(string()),
    tagline: optional(string()),
  },
  content: {
    content: '*',
  },
} satisfies ContentDefinition;

/**
 * `LinkSnippet`: `LinkSnippet`, a URL with a copy button.
 *
 * Config: `url`.
 */
export const LINK_SNIPPET_DEFINITION = {
  name: 'LinkSnippet',
  component: () => import('@atlasng/design-system/links/link-snippet').then((m) => m.LinkSnippet),
  config: {
    url: string(),
  },
} satisfies ContentDefinition;

/**
 * `Notice`: `Notice`, a highlighted message of projected content.
 *
 * Config: optional `variant` (`info`, `success`, `warning`, `critical`, or `unavailable`) and `tagline`.
 */
export const NOTICE_DEFINITION = {
  name: 'Notice',
  component: () => import('@atlasng/design-system/indicators/notice').then((m) => m.Notice),
  config: {
    variant: optional(oneOf(['info', 'success', 'warning', 'critical', 'unavailable'])),
    tagline: optional(string()),
  },
  content: {
    content: '*',
  },
} satisfies ContentDefinition;

/**
 * `TextLink`: a design-system `TextLink` whose content is the link text.
 *
 * Config: `href`.
 */
export const TEXT_LINK_DEFINITION = {
  name: 'TextLink',
  component: () => import('./wrappers/content-text-link').then((m) => m.ContentTextLink),
  config: {
    href: string(),
  },
  content: {
    content: '*',
  },
} satisfies ContentDefinition;

/** Every definition in this entry point, e.g. for `withDefinitions(DESIGN_SYSTEM_DEFINITIONS)`. */
export const DESIGN_SYSTEM_DEFINITIONS: ContentDefinition[] = [
  CONTENT_HEADER_DEFINITION,
  CONTENT_PARAGRAPH_DEFINITION,
  CONTENT_SECTION_DEFINITION,
  HEADING_DEFINITION,
  LINK_SNIPPET_DEFINITION,
  NOTICE_DEFINITION,
  TEXT_LINK_DEFINITION,
];
