import { Binding, ComponentMirror, inputBinding, reflectComponentType, Type } from '@angular/core';
import { ResolvedElement } from '../nodes/render-node';
import { getComponentInputs } from '../pipeline/component';

/**
 * Creates input bindings for a node's config and data, matched by input template name. Data is bound to its signal, so
 * later emissions update the input. Keys without an input are skipped; they were reported when the node resolved.
 *
 * @param mirror Reflected metadata of the component.
 * @param resolved The resolved node.
 * @returns One binding per key with an input. A key used by both config and data binds the data.
 */
export function createInputBindings(mirror: ComponentMirror<unknown>, { config, data }: ResolvedElement): Binding[] {
  const inputs = getComponentInputs(mirror);
  const bindings: Binding[] = [];

  for (const [key, value] of Object.entries(config)) {
    if (inputs.has(key) && !Object.hasOwn(data, key)) {
      bindings.push(inputBinding(key, () => value));
    }
  }
  for (const [key, value] of Object.entries(data)) {
    if (inputs.has(key)) {
      bindings.push(inputBinding(key, value));
    }
  }

  return bindings;
}

/**
 * Creates input bindings only for the values whose key matches an input of the component. Used for text, placeholder,
 * and error components, which may declare any subset of their inputs.
 *
 * @param type Component class.
 * @param values Candidate values keyed by input template name.
 * @returns Bindings for the declared inputs.
 */
export function createOptionalBindings(type: Type<unknown>, values: Record<string, unknown>): Binding[] {
  const inputs = getComponentInputs(reflectComponentType(type));
  return Object.entries(values)
    .filter(([key]) => inputs.has(key))
    .map(([key, value]) => inputBinding(key, () => value));
}
