import { ContentComponentDefinition } from '@atlasng/content-templates';
import type { TextLink } from '@atlasng/design-system/links/text-link';

/**
 * Creates the `text-link` definition for `TextLink`, rendered on an `a` host element. Content is the link text;
 * the `icon` slot takes icons shown after it.
 *
 * Takes no schema library, since the link has no config or data; the signature matches the other definitions.
 *
 * @returns The definition.
 */
export function createTextLinkDefinition(): ContentComponentDefinition<TextLink> {
  return {
    name: 'text-link',
    component: () => import('@atlasng/design-system/links/text-link').then((m) => m.TextLink),
    host: 'a',
    slots: { content: '*', icon: '.material-icons, mat-icon, [matButtonIcon]' },
    defaultSlot: 'content',
  };
}
