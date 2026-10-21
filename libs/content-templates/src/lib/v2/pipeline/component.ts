import { reflectComponentType, Type } from '@angular/core';
import { ContentDefinition, DefaultExport, TypeRef } from '@atlasng/content-templates/types';
import { StandardSchemaV1 } from '@standard-schema/spec';
import { Promisable } from 'type-fest';

/**
 * Resolves a component class from a class or a lazy loader. Classes are recognized with `reflectComponentType`.
 *
 * @param loadable Component class or loader.
 * @returns The component class. Rejects when the loader does not resolve to a component.
 */
export async function loadComponent<T>(loadable: TypeRef<T>): Promise<Type<T>> {
  if (reflectComponentType(loadable as Type<T>)) {
    return loadable as Type<T>;
  }

  const result = await (loadable as () => Promisable<Type<T> | DefaultExport<Type<T>>>)();
  const type = typeof result === 'object' && result !== null && 'default' in result ? result.default : result;
  if (!reflectComponentType(type)) {
    throw new Error('Component loader did not resolve to a component.');
  }

  return type;
}

/**
 * Finds config and data keys the component has no input for. Inputs are matched by template name, i.e. by alias when
 * the input has one.
 *
 * Missing required inputs cannot be detected here, since Angular does not expose whether an input is required; Angular
 * reports them when the input is first read.
 *
 * @param definition The node's definition.
 * @param component The loaded component class.
 * @param config Validated config outputs.
 * @param data Data keys the definition declares.
 * @returns One issue per key without an input.
 */
export function checkComponentInputs(
  definition: ContentDefinition,
  component: Type<unknown>,
  config: readonly string[],
  data: readonly string[],
): StandardSchemaV1.Issue[] {
  const mirror = reflectComponentType(component);
  const templateNames = mirror?.inputs.map((input) => input.templateName);
  const inputs = new Set(templateNames);
  const { name } = definition;

  return [...checkMissingInputs(name, inputs, 'config', config), ...checkMissingInputs(name, inputs, 'data', data)];
}

/**
 * Creates issues for keys without a matching component input.
 *
 * @param name Definition name, used in messages.
 * @param inputs Template names of the component's inputs.
 * @param property Node property the keys belong to, e.g. `config`. Used in messages and as the issue path prefix.
 * @param keys Keys to check.
 * @returns One issue per key without an input.
 */
function checkMissingInputs(
  name: string,
  inputs: ReadonlySet<string>,
  property: string,
  keys: readonly string[],
): StandardSchemaV1.Issue[] {
  const missingKeys = keys.filter((key) => !inputs.has(key));
  return missingKeys.map((key) => ({
    message: `Component '${name}' has no input '${key}' for ${property}.`,
    path: [property, key],
  }));
}
