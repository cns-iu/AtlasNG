import { ContentDefinition } from '@atlasng/content-blocks/types';
import {
  arrayable,
  arrayOf,
  boolean,
  headingLevel,
  link,
  number,
  oneOf,
  optional,
  string,
  tableColumn,
  tableRows,
  youTubePlayerVars,
} from './schemas';

/**
 * `BasicProfileCard`: `BasicProfileCard`, a profile picture, name, and description(s).
 *
 * Config: `image` URL, `name`, `description` (a string or a list of paragraphs), and an optional `link` for the name,
 * e.g. `"/people/ada"`, `["/people", 42]`, or `{ "command": "https://example.com", "fragment": "bio" }`.
 */
export const BASIC_PROFILE_CARD_DEFINITION = {
  name: 'BasicProfileCard',
  component: () => import('@atlasng/design-system/cards/basic-profile-card').then((m) => m.BasicProfileCard),
  config: {
    image: string(),
    name: string(),
    description: arrayable(string()),
    link: optional(link()),
  },
} satisfies ContentDefinition;

/**
 * `BrandProfileCard`: `BrandProfileCard`, a branded profile picture, name, description, and actions.
 *
 * Config: `image` URL, `name`, `description`, and optional `centered`. Content: `actions`, e.g. `TextLink` nodes.
 */
export const BRAND_PROFILE_CARD_DEFINITION = {
  name: 'BrandProfileCard',
  component: () => import('@atlasng/design-system/cards/brand-profile-card').then((m) => m.BrandProfileCard),
  config: {
    image: string(),
    name: string(),
    description: string(),
    centered: optional(boolean()),
  },
  content: {
    actions: 'ang-brand-profile-card-action, [angBrandProfileCardAction]',
  },
} satisfies ContentDefinition;

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
 * Config: `tagline` and `level` (1-6), and optional `id` and `underlined`. Content: unkeyed content is the section body,
 * and `header` is shown next to the title.
 */
export const CONTENT_SECTION_DEFINITION = {
  name: 'ContentSection',
  component: () => import('@atlasng/design-system/content/content-section').then((m) => m.ContentSection),
  config: {
    tagline: string(),
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
 * `Table`: a design-system `Table` with JSON column descriptions.
 *
 * Config: `columns`, each with a row key `prop`, and optional header `name`, cell `type` (`text`, `number`, `code`,
 * `chip`, or `link`), `align`, `sortable`, `minWidth`, `flexGrow`, and, for links, `label` or `labelProp`; and optional
 * `appearance` (`striped`, `grid`, `vertical-rules`, or `none`) and `rowHeight`. Data: `rows`, an array of objects
 * keyed by column `prop`, inline or loaded, e.g. from a CSV file; empty until loaded. The table is virtualized, so give
 * long tables a `maxHeight` style.
 */
export const TABLE_DEFINITION = {
  name: 'Table',
  component: () => import('./wrappers/content-table').then((m) => m.ContentTable),
  config: {
    columns: arrayOf(tableColumn()),
    appearance: optional(oneOf(['striped', 'grid', 'vertical-rules', 'none'])),
    rowHeight: optional(number()),
  },
  data: {
    rows: { schema: tableRows(), initialValue: () => [] },
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

/**
 * `YouTubePlayer`: `YouTubePlayer`, an embedded video shown once marketing cookies are allowed, and a placeholder
 * linking to YouTube until then.
 *
 * Config: `videoId`, and optional `width` and `height` (largest size in pixels, and aspect ratio), `startSeconds`,
 * `endSeconds`, `suggestedQuality`, `playerVars` (a subset of `YT.PlayerVars`, e.g. `{ "autoplay": 1, "mute": 1 }`),
 * `disablePlaceholder`, `placeholderButtonLabel`, and `placeholderImageQuality` (`high`, `standard`, or `low`).
 * Content: `enableRequest` replaces the default request to enable cookies.
 */
export const YOUTUBE_PLAYER_DEFINITION = {
  name: 'YouTubePlayer',
  component: () => import('@atlasng/design-system/youtube-player').then((m) => m.YouTubePlayer),
  config: {
    videoId: string(),
    width: optional(number()),
    height: optional(number()),
    startSeconds: optional(number()),
    endSeconds: optional(number()),
    suggestedQuality: optional(oneOf(['default', 'small', 'medium', 'large', 'hd720', 'hd1080', 'highres'])),
    playerVars: optional(youTubePlayerVars()),
    disablePlaceholder: optional(boolean()),
    placeholderButtonLabel: optional(string()),
    placeholderImageQuality: optional(oneOf(['high', 'standard', 'low'])),
  },
  content: {
    enableRequest: '[angYouTubePlayerEnableRequest]',
  },
} satisfies ContentDefinition;

/** Every definition in this entry point, e.g. for `withDefinitions(DESIGN_SYSTEM_DEFINITIONS)`. */
export const DESIGN_SYSTEM_DEFINITIONS: ContentDefinition[] = [
  BASIC_PROFILE_CARD_DEFINITION,
  BRAND_PROFILE_CARD_DEFINITION,
  CONTENT_HEADER_DEFINITION,
  CONTENT_PARAGRAPH_DEFINITION,
  CONTENT_SECTION_DEFINITION,
  HEADING_DEFINITION,
  LINK_SNIPPET_DEFINITION,
  NOTICE_DEFINITION,
  TABLE_DEFINITION,
  TEXT_LINK_DEFINITION,
  YOUTUBE_PLAYER_DEFINITION,
];
