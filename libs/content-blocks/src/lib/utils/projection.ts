import { ContentProjectionSchema, DEFAULT_CONTENT } from '@atlasng/content-blocks/types';

/**
 * Finds the projection entry receiving content not keyed by name: the entry named by {@link DEFAULT_CONTENT}, or else
 * the entry whose selector is `*`.
 *
 * @param projection The definition's projection schema.
 * @returns The entry name, or `undefined` when unkeyed content cannot be projected.
 */
export function getDefaultContentName(projection: ContentProjectionSchema): string | undefined {
  return projection[DEFAULT_CONTENT] ?? Object.keys(projection).find((name) => projection[name] === '*');
}

/**
 * Resolves a content key of a node to its projection entry name.
 *
 * @param projection The definition's projection schema.
 * @param key Content name, or {@link DEFAULT_CONTENT} for unkeyed content.
 * @returns The entry name, or `undefined` for unkeyed content without a default entry.
 */
export function getContentName(
  projection: ContentProjectionSchema,
  key: string | typeof DEFAULT_CONTENT,
): string | undefined {
  return key === DEFAULT_CONTENT ? getDefaultContentName(projection) : key;
}

/**
 * Finds the `ng-content` selector content under a key is projected into.
 *
 * @param projection The definition's projection schema.
 * @param key Content name, or {@link DEFAULT_CONTENT} for unkeyed content.
 * @returns The selector, or `undefined` when the projection has no entry for the key.
 */
export function getContentSelector(
  projection: ContentProjectionSchema,
  key: string | typeof DEFAULT_CONTENT,
): string | undefined {
  const name = getContentName(projection, key);
  return name !== undefined && Object.hasOwn(projection, name) ? projection[name] : undefined;
}

/**
 * Finds the projection slot of content under a key, i.e. the index of its selector in the component's `ng-content`
 * selectors, as used by `projectableNodes`.
 *
 * @param projection The definition's projection schema.
 * @param selectors The component's `ng-content` selectors.
 * @param key Content name, or {@link DEFAULT_CONTENT} for unkeyed content.
 * @returns The slot index, or `-1` when the projection has no entry for the key or the component lacks its selector.
 */
export function getContentSlot(
  projection: ContentProjectionSchema,
  selectors: readonly string[],
  key: string | typeof DEFAULT_CONTENT,
): number {
  const selector = getContentSelector(projection, key);
  return selector === undefined ? -1 : selectors.indexOf(selector);
}
