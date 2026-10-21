import { ContentDefinition } from '@atlasng/content-templates/types';
import { RenderElementNode, ResolvedElement } from '../nodes/render-node';
import { validateConfig } from '../validation/config';
import { reportRecoverableIssues } from '../validation/errors';
import { checkComponentInputs, loadComponent } from './component';
import { PipelineContext } from './context';
import { loadData } from './data';

/**
 * Loads the component, validates config, and loads data of a checked node, all in parallel, then checks that the
 * component has an input for every config and data key.
 *
 * Config validation is deferred to a microtask, so a synchronous schema does not hold up the other steps.
 *
 * @param node Element node whose definition passed the unknown-key checks.
 * @param definition The node's definition.
 * @param context Pipeline context.
 * @param onError Called with an error from a later data emission.
 * @returns Everything needed to render the node. Rejects with the first failing step.
 * @throws {ContentValidationError} In dev mode, when the component lacks an input for a key.
 */
export async function resolveElement(
  node: RenderElementNode,
  definition: ContentDefinition,
  context: PipelineContext,
  onError: (error: unknown) => void,
): Promise<ResolvedElement> {
  const [component, config, data] = await Promise.all([
    loadComponent(definition.component),
    Promise.resolve().then(() => validateConfig(definition.config, node.source.config, node.path)),
    loadData(node, definition.data, context, onError),
  ]);

  reportRecoverableIssues(
    node.path,
    checkComponentInputs(definition, component, Object.keys(config), Object.keys(data)),
  );

  return { definition, component, config, data };
}
