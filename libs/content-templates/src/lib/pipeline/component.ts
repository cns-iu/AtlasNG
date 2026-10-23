import { ComponentMirror, reflectComponentType, Type } from '@angular/core';
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
 * Lists a component's inputs by template name, i.e. by alias when the input has one.
 *
 * @param mirror Reflected metadata of the component, or `null` when it is not a component.
 * @returns The input template names; empty for `null`.
 */
export function getComponentInputs(mirror: ComponentMirror<unknown> | null): Set<string> {
  return new Set(mirror?.inputs.map((input) => input.templateName));
}

/**
 * Finds config and data keys the component has no input for, and keys used by both config and data. Inputs are matched
 * by template name, i.e. by alias when the input has one.
 *
 * Missing required inputs cannot be detected here, since Angular does not expose whether an input is required; Angular
 * reports them when the input is first read.
 *
 * @param definition The node's definition.
 * @param mirror Reflected metadata of the loaded component.
 * @param config Validated config outputs.
 * @param data Data keys the definition declares.
 * @returns One issue per key without an input, and one per key used by both config and data.
 */
export function checkComponentInputs(
  definition: ContentDefinition,
  mirror: ComponentMirror<unknown>,
  config: readonly string[],
  data: readonly string[],
): StandardSchemaV1.Issue[] {
  const inputs = getComponentInputs(mirror);
  const { name } = definition;

  return [
    ...checkMissingInputs(name, inputs, 'config', config),
    ...checkMissingInputs(name, inputs, 'data', data),
    ...checkConflictingInputs(name, config, data),
  ];
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

/**
 * Creates issues for keys used by both config and data, which would bind the same input twice. When rendered anyway,
 * the data is bound.
 *
 * @param name Definition name, used in messages.
 * @param config Config keys.
 * @param data Data keys.
 * @returns One issue per key used by both.
 */
function checkConflictingInputs(
  name: string,
  config: readonly string[],
  data: readonly string[],
): StandardSchemaV1.Issue[] {
  const conflictingKeys = config.filter((key) => data.includes(key));
  return conflictingKeys.map((key) => ({
    message: `Component '${name}' uses input '${key}' for both config and data.`,
    path: ['config', key],
  }));
}
