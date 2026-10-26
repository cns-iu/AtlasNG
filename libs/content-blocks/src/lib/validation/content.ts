import { ContentDefinition, DEFAULT_CONTENT } from '@atlasng/content-blocks/types';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { RenderElementNode } from '../nodes/render-node';
import { getDefaultContentName } from '../utils/projection';
import { checkUnknownKeys } from './errors';

/**
 * Finds content the definition cannot project: content names without a projection entry, and unkeyed content when no
 * entry receives it.
 *
 * @param node Element node.
 * @param definition The node's definition.
 * @returns One issue per unknown content name or for unkeyed content, or a single issue when the definition accepts no
 *   content.
 */
export function checkUnknownContentKeys(
  node: RenderElementNode,
  definition: ContentDefinition,
): StandardSchemaV1.Issue[] {
  const { name, content: projection } = definition;
  const hasDefaultContent = node.content[DEFAULT_CONTENT] !== undefined;
  if (projection === undefined && hasDefaultContent) {
    return [{ message: `Component '${name}' does not accept content.`, path: ['content'] }];
  }

  const issues: StandardSchemaV1.Issue[] = [];
  if (projection !== undefined && hasDefaultContent && getDefaultContentName(projection) === undefined) {
    issues.push({ message: `Component '${name}' has no default content.`, path: ['content'] });
  }
  issues.push(...checkUnknownKeys(name, 'content', Object.keys(node.content), projection));

  return issues;
}
