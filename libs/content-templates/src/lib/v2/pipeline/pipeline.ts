import { DefinitionRegistry } from '@atlasng/content-templates/definitions';
import { isRenderElementNode, RenderElementNode, RenderNode } from '../nodes/render-node';
import { loadDefinition, prefetchDefinitions } from './definitions';
import { checkDefinitionKeys } from './release';

/**
 * Starts the pipeline for a render tree. Every definition starts loading at once; each node is then checked as soon as
 * its own definition is loaded and its parent has released it, and releases its children in turn.
 *
 * Results are stored on the nodes as {@link RenderElementNode.definition}.
 *
 * @param nodes Top level nodes of the tree.
 * @param registry Registry to load definitions from.
 */
export function startPipeline(nodes: readonly RenderNode[], registry: DefinitionRegistry): void {
  prefetchDefinitions(nodes, registry);

  for (const node of nodes) {
    if (isRenderElementNode(node)) {
      startNode(node, registry);
    }
  }
}

/**
 * Loads and checks a node's definition, then releases its element children unless the node failed or was aborted.
 *
 * @param node Element node.
 * @param registry Registry to load definitions from.
 */
function startNode(node: RenderElementNode, registry: DefinitionRegistry): void {
  const { signal } = node.abortController;
  if (signal.aborted) {
    return;
  }

  node.definition = loadDefinition(node, registry).then((definition) => {
    checkDefinitionKeys(node, definition);
    return definition;
  });

  node.definition.then(
    () => startChildNodes(node, registry),
    () => undefined,
  );
}

/**
 * Releases a checked node's element children, unless the node was aborted while it was being checked.
 *
 * @param node Element node whose definition passed the checks.
 * @param registry Registry to load definitions from.
 */
function startChildNodes(node: RenderElementNode, registry: DefinitionRegistry): void {
  if (node.abortController.signal.aborted) {
    return;
  }

  node.elementChildren.forEach((child) => startNode(child, registry));
}
