import { ContentConfigSchema, ContentDefinition, ContentElementNode } from '@atlasng/content-templates/types';
import { ContentValidationError } from '@atlasng/content-templates/utils';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { JsonValue } from 'type-fest';
import { RenderElementNode } from '../nodes/render-node';
import { isStandardSchema, prefixIssues } from '../utils/standard-schema';
import { checkUnknownKeys } from './errors';

/**
 * Finds config keys the definition declares no schema for. A single schema for the whole config object decides which
 * keys it accepts, so nothing is reported for it here.
 *
 * @param node Element node.
 * @param definition The node's definition.
 * @returns One issue per unknown key, or a single issue when the definition accepts no config.
 */
export function checkUnknownConfigKeys(
  node: RenderElementNode,
  definition: ContentDefinition,
): StandardSchemaV1.Issue[] {
  const { config: schema } = definition;
  if (isStandardSchema(schema)) {
    return [];
  }

  return checkUnknownKeys(definition.name, 'config', Object.keys(node.source.config ?? {}), schema);
}

/**
 * Validates a node's config with the definition's config schema. Unknown keys are not reported here (see
 * {@link checkUnknownConfigKeys}); a per-key schema leaves them out of the output.
 *
 * @param schema The definition's config schema, or `undefined` when it accepts no config.
 * @param config The node's config.
 * @param path Path of the node, used in errors.
 * @returns Config outputs keyed by config key, without `undefined` outputs; `{}` without a schema. Rejects with a
 *   {@link ContentValidationError} whose issue paths start with `config`.
 */
export async function validateConfig(
  schema: ContentConfigSchema | undefined,
  config: ContentElementNode['config'] = {},
  path: string,
): Promise<Record<string, unknown>> {
  if (schema === undefined) {
    return {};
  }

  let result: StandardSchemaV1.Result<object>;
  if (isStandardSchema(schema)) {
    result = await schema['~standard'].validate(config);
  } else {
    result = await validateConfigPerKey(schema, config);
  }

  if (result.issues) {
    throw new ContentValidationError(path, prefixIssues(result.issues, ['config']));
  }

  const entries = Object.entries(result.value).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries);
}

/**
 * Validates config with one schema per key, as a single Standard Schema result. Every key's schema runs, so a missing
 * key is validated as `undefined`.
 *
 * @param schemas Schemas keyed by config key.
 * @param config The node's config.
 * @returns The outputs keyed by config key, or every key's issues with paths starting at the key.
 */
async function validateConfigPerKey(
  schemas: Record<string, StandardSchemaV1<JsonValue | undefined, unknown>>,
  config: ContentElementNode['config'],
): Promise<StandardSchemaV1.Result<Record<string, unknown>>> {
  const issues: StandardSchemaV1.Issue[] = [];
  const output: Record<string, unknown> = {};
  const validate = async (key: string, schema: StandardSchemaV1<JsonValue | undefined, unknown>) => {
    const result = await schema['~standard'].validate(config?.[key]);
    if (result.issues) {
      issues.push(...prefixIssues(result.issues, [key]));
    } else {
      output[key] = result.value;
    }
  };

  await Promise.all(Object.entries(schemas).map(([key, schema]) => validate(key, schema)));

  if (issues.length > 0) {
    return { issues };
  }

  return { value: output };
}
