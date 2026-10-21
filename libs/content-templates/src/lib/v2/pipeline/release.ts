import { ContentDefinition, DEFAULT_CONTENT } from '@atlasng/content-templates/types';
import { RenderElementNode, RenderNodeKey } from '../nodes/render-node';
import { getDefaultContentName } from '../utils/projection';
import { checkUnknownConfigKeys } from '../validation/config';
import { checkUnknownContentKeys } from '../validation/content';
import { checkUnknownDataKeys } from '../validation/data';
import { reportRecoverableIssues } from '../validation/errors';

/**
 * Checks a node for config, data, and content keys its definition does not declare. In prod mode, content the
 * definition cannot project is removed from the node; unknown config and data keys are left for later steps to skip.
 *
 * @param node Element node.
 * @param definition The node's definition.
 * @throws {ContentValidationError} In dev mode, when there are unknown keys.
 */
export function checkDefinitionKeys(node: RenderElementNode, definition: ContentDefinition): void {
  reportRecoverableIssues(node.path, [
    ...checkUnknownConfigKeys(node, definition),
    ...checkUnknownDataKeys(node, definition),
    ...checkUnknownContentKeys(node, definition),
  ]);

  for (const key of Reflect.ownKeys(node.content) as RenderNodeKey[]) {
    if (!isKnownContentKey(definition, key)) {
      delete node.content[key];
    }
  }
}

/**
 * Checks whether a definition can project the content stored under a key.
 *
 * @param definition The node's definition.
 * @param key Content name, or {@link DEFAULT_CONTENT} for unkeyed content.
 * @returns Whether the content can be projected.
 */
function isKnownContentKey({ content: projection }: ContentDefinition, key: RenderNodeKey): boolean {
  if (projection === undefined) {
    return false;
  } else if (key === DEFAULT_CONTENT) {
    return getDefaultContentName(projection) !== undefined;
  }

  return Object.hasOwn(projection, key);
}
