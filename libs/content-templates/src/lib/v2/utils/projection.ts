import { ContentProjectionSchema, DEFAULT_CONTENT } from '@atlasng/content-templates/types';

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
