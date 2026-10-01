import { StandardSchemaV1 } from '@standard-schema/spec';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentElementNode } from '../types/content-document';
import { ContentValidationError } from './errors';

/** A single data schema entry, as declared in {@link ContentComponentDefinition.data}. */
type DataSchemaEntry = NonNullable<ContentComponentDefinition['data']>[string];

/**
 * Validates a node's config against its definition.
 *
 * @param definition Definition of the node.
 * @param node Node whose config is validated.
 * @param path Path of the node, used in errors.
 * @returns Config outputs keyed by config key, without `undefined` outputs. Rejects with a
 *   {@link ContentValidationError}.
 */
export async function validateConfig(
  definition: ContentComponentDefinition,
  node: ContentElementNode,
  path: string,
): Promise<Record<string, unknown>> {
  const config = node.config ?? {};
  const schema = definition.config;
  if (schema === undefined) {
    if (Object.keys(config).length > 0) {
      throw new ContentValidationError(path, [
        { message: `Component '${definition.name}' does not accept config.`, path: ['config'] },
      ]);
    }
    return {};
  }

  if (isStandardSchema(schema)) {
    const result = await schema['~standard'].validate(config);
    if (result.issues) {
      throw new ContentValidationError(path, prefixIssues(result.issues, ['config']));
    }
    return omitUndefined(result.value as Record<string, unknown>);
  }

  const issues = unknownKeyIssues(config, schema, 'config');
  const output: Record<string, unknown> = {};
  await Promise.all(
    Object.entries(schema).map(async ([key, keySchema]) => {
      const result = await keySchema['~standard'].validate(config[key]);
      if (result.issues) {
        issues.push(...prefixIssues(result.issues, ['config', key]));
      } else {
        output[key] = result.value;
      }
    }),
  );

  if (issues.length > 0) {
    throw new ContentValidationError(path, issues);
  }
  return omitUndefined(output);
}

/**
 * Validates a node's loaded data against its definition, applying default values for missing keys.
 *
 * @param definition Definition of the node.
 * @param loaded Loaded and parsed values keyed by data name, for the keys the node provides.
 * @param path Path of the node, used in errors.
 * @returns Data outputs keyed by data name, without `undefined` values. Rejects with a load error or a
 *   {@link ContentValidationError}.
 */
export async function validateData(
  definition: ContentComponentDefinition,
  loaded: Record<string, Promise<unknown>>,
  path: string,
): Promise<Record<string, unknown>> {
  const schemas = definition.data ?? {};
  const issues = unknownKeyIssues(loaded, schemas, 'data');
  if (definition.data === undefined && issues.length > 0) {
    throw new ContentValidationError(path, [
      { message: `Component '${definition.name}' does not accept data.`, path: ['data'] },
    ]);
  }

  const output: Record<string, unknown> = {};
  await Promise.all(
    Object.entries(schemas).map(async ([key, entry]) => {
      const { schema, hasDefault, defaultValue } = normalizeDataEntry(entry);
      if (!Object.hasOwn(loaded, key) && hasDefault) {
        output[key] = defaultValue;
        return;
      }

      const value = Object.hasOwn(loaded, key) ? await loaded[key] : undefined;
      if (schema === 'any') {
        output[key] = value;
        return;
      }

      const result = await schema['~standard'].validate(value);
      if (result.issues) {
        issues.push(...prefixIssues(result.issues, ['data', key]));
      } else {
        output[key] = result.value;
      }
    }),
  );

  if (issues.length > 0) {
    throw new ContentValidationError(path, issues);
  }
  return omitUndefined(output);
}

/**
 * Splits a data schema entry into its schema and optional default value.
 *
 * @param entry Entry from the definition's data schemas.
 * @returns The schema, whether a default is declared, and the default value.
 */
function normalizeDataEntry(entry: DataSchemaEntry): {
  schema: 'any' | StandardSchemaV1<unknown>;
  hasDefault: boolean;
  defaultValue: unknown;
} {
  if (entry === 'any' || isStandardSchema(entry)) {
    return { schema: entry, hasDefault: false, defaultValue: undefined };
  }
  return { schema: entry.schema, hasDefault: 'defaultValue' in entry, defaultValue: entry.defaultValue };
}

/**
 * Creates issues for keys that have no schema.
 *
 * @param values Values keyed by name.
 * @param schemas Schemas keyed by name.
 * @param property Node property the keys belong to, used as the issue path prefix.
 * @returns One issue per unknown key.
 */
function unknownKeyIssues(values: object, schemas: object, property: 'config' | 'data'): StandardSchemaV1.Issue[] {
  return Object.keys(values)
    .filter((key) => !Object.hasOwn(schemas, key))
    .map((key) => ({ message: `Unknown ${property} key '${key}'.`, path: [property, key] }));
}

/**
 * Prefixes issue paths so they are relative to the node.
 *
 * @param issues Issues reported by a schema.
 * @param prefix Path segments to prepend.
 * @returns Issues with prefixed paths.
 */
function prefixIssues(issues: readonly StandardSchemaV1.Issue[], prefix: PropertyKey[]): StandardSchemaV1.Issue[] {
  return issues.map((issue) => ({ ...issue, path: [...prefix, ...(issue.path ?? [])] }));
}

/**
 * Checks whether a value is a Standard Schema.
 *
 * @param value Value to check.
 * @returns Whether the value has a `~standard` property.
 */
function isStandardSchema(value: object): value is StandardSchemaV1 {
  return '~standard' in value;
}

/**
 * Removes keys whose value is `undefined`, so bound inputs keep their component defaults.
 *
 * @param record Record to filter.
 * @returns A record without `undefined` values.
 */
function omitUndefined(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}
