import { ContentDefinition } from '@atlasng/content-blocks/types';
import { ContentValidationError } from '@atlasng/content-blocks/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { RenderElementNode } from '../nodes/render-node';
import { prefixIssues } from '../utils/standard-schema';
import { checkUnknownKeys } from './errors';

/**
 * Finds data keys the definition declares no schema for.
 *
 * @param node Element node.
 * @param definition The node's definition.
 * @returns One issue per unknown key, or a single issue when the definition accepts no data.
 */
export function checkUnknownDataKeys(node: RenderElementNode, definition: ContentDefinition): StandardSchemaV1.Issue[] {
  return checkUnknownKeys(definition.name, 'data', Object.keys(node.source.data ?? {}), definition.data);
}

/**
 * Validates one loaded data value. Called for the first value and again for every later emission.
 *
 * @param schema Schema of the data key.
 * @param value Loaded and parsed value, or `undefined` when the node does not provide the key.
 * @param key Data key, used in issue paths.
 * @param path Path of the node, used in errors.
 * @returns The validated output. Rejects with a {@link ContentValidationError}.
 */
export async function validateDataValue(
  schema: StandardSchemaV1<unknown>,
  value: unknown,
  key: string,
  path: string,
): Promise<unknown> {
  const result = await schema['~standard'].validate(value);
  if (result.issues) {
    throw new ContentValidationError(path, prefixIssues(result.issues, ['data', key]));
  }
  return result.value;
}
