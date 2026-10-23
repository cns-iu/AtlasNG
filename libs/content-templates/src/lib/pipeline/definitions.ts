import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import { ContentDefinition } from '@atlasng/content-templates/types';
import { ContentValidationError } from '@atlasng/content-templates/utils';
import { isRenderElementNode, RenderElementNode, RenderNode } from '../nodes/render-node';

/**
 * Starts loading the definition of every element in the tree at once, so no node waits on a load started by its
 * parent. The registry caches the loads; {@link loadDefinition} picks them up later. Failures are left to
 * {@link loadDefinition}.
 *
 * @param nodes Nodes to walk.
 * @param registry Registry to load from.
 */
export function prefetchDefinitions(nodes: readonly RenderNode[], registry: DefinitionRegistry): void {
  for (const node of nodes) {
    if (isRenderElementNode(node)) {
      registry.get(node.source.component)?.catch(() => undefined);
      prefetchDefinitions(node.elementChildren, registry);
    }
  }
}

/**
 * Loads a node's definition.
 *
 * @param node Element node.
 * @param registry Registry to load from.
 * @returns The definition. Rejects with a {@link ContentValidationError} when no definition is registered under the
 *   node's component name, or with the registry's error when loading fails.
 */
export async function loadDefinition(
  node: RenderElementNode,
  registry: DefinitionRegistry,
): Promise<ContentDefinition> {
  const { component } = node.source;
  const definition = registry.get(component);
  if (definition === undefined) {
    throw new ContentValidationError(node.path, [
      { message: `Unknown component definition '${component}'.`, path: ['component'] },
    ]);
  }

  return definition;
}
