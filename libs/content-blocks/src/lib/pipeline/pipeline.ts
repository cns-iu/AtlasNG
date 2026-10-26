import { isRenderElementNode, RenderElementNode, RenderNode } from '../nodes/render-node';
import { PipelineContext } from './context';
import { loadDefinition, prefetchDefinitions } from './definitions';
import { checkDefinitionKeys } from './release';
import { resolveElement } from './resolve';

/**
 * Starts the pipeline for a render tree. Every definition starts loading at once; each node is then checked as soon as
 * its own definition is loaded and its parent has released it, and releases its children in turn. Once checked, a
 * node also loads its component, config, and data.
 *
 * Results are stored on the nodes as {@link RenderElementNode.definition} and {@link RenderElementNode.resolved}, and
 * failures as {@link RenderElementNode.error}.
 *
 * @param nodes Top level nodes of the tree.
 * @param context Pipeline context.
 */
export function startPipeline(nodes: readonly RenderNode[], context: PipelineContext): void {
  prefetchDefinitions(nodes, context.definitions);

  for (const node of nodes) {
    if (isRenderElementNode(node)) {
      startNode(node, context);
    }
  }
}

/**
 * Loads and checks a node's definition, then releases its element children and resolves the node, unless the node
 * failed or was aborted.
 *
 * @param node Element node.
 * @param context Pipeline context.
 */
function startNode(node: RenderElementNode, context: PipelineContext): void {
  const { abortSignal } = node;
  if (abortSignal.aborted) {
    return;
  }

  // Rejections caused by the node's own abort, i.e. a discarded tree or a failed ancestor, are not failures of the node.
  const fail = (error: unknown) => {
    if (!abortSignal.aborted || error !== abortSignal.reason) {
      node.fail(error);
    }
  };
  const definition = loadDefinition(node, context.definitions).then((def) => {
    checkDefinitionKeys(node, def);
    return def;
  });
  const resolved = definition.then((def) => resolveElement(node, def, context, fail));

  definition.then(() => startChildNodes(node, context), fail);
  resolved.catch(fail);

  node.definition = definition;
  node.resolved = resolved;
}

/**
 * Releases a checked node's element children, unless the node was aborted while it was being checked.
 *
 * @param node Element node whose definition passed the checks.
 * @param context Pipeline context.
 */
function startChildNodes(node: RenderElementNode, context: PipelineContext): void {
  if (node.abortSignal.aborted) {
    return;
  }

  node.elementChildren.forEach((child) => startNode(child, context));
}
