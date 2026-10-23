import { ContentDataSource, ContentElementNode, ContentNode } from '@atlasng/content-templates/types';
import { Arrayable } from 'type-fest';

/**
 * Checks whether a value is a non-array object.
 *
 * @param value Value to check.
 * @returns Whether the value is a non-null, non-array object.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Checks whether a value is a {@link ContentElementNode}, i.e. an object with a string `component`.
 *
 * @param value Value to check.
 * @returns Whether the value is an element node.
 */
export function isContentElementNode(value: unknown): value is ContentElementNode {
  return isPlainObject(value) && typeof value['component'] === 'string';
}

/**
 * Checks whether a data value is a {@link ContentDataSource}, i.e. an object with a string `type`.
 *
 * @param value Value to check.
 * @returns Whether the value is a data source.
 */
export function isContentDataSource(value: unknown): value is ContentDataSource {
  return isPlainObject(value) && typeof value['type'] === 'string';
}

/**
 * Checks whether node content is a record keyed by content name rather than a node or node list.
 *
 * @param content Content of an element node.
 * @returns Whether the content maps content names to nodes.
 */
export function isNamedContentRecord(
  content: NonNullable<ContentElementNode['content']>,
): content is Record<string, Arrayable<ContentNode>> {
  return isPlainObject(content) && !isContentElementNode(content);
}
