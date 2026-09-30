import { Binding, ComponentMirror, inputBinding, reflectComponentType, Type } from '@angular/core';

/**
 * Creates input bindings for a node's config and data outputs, matched by input template name.
 *
 * @param mirror Reflected metadata of the component.
 * @param config Validated config outputs.
 * @param data Validated data outputs.
 * @param name Definition name, used in errors.
 * @returns One binding per key.
 * @throws In dev mode, when a key matches no input, or a key is used by both config and data. In prod mode such
 *   keys are skipped (collisions bind the data value).
 */
export function createInputBindings(
  mirror: ComponentMirror<unknown>,
  config: Record<string, unknown>,
  data: Record<string, unknown>,
  name: string,
): Binding[] {
  const devMode = typeof ngDevMode === 'undefined' || ngDevMode;
  if (devMode) {
    const collisions = Object.keys(config).filter((key) => Object.hasOwn(data, key));
    if (collisions.length > 0) {
      throw new Error(`Component '${name}' uses ${formatKeys(collisions)} for both config and data.`);
    }
  }

  const inputs = new Set(mirror.inputs.map((input) => input.templateName));
  const values = { ...config, ...data };
  const unknown = Object.keys(values).filter((key) => !inputs.has(key));
  if (devMode && unknown.length > 0) {
    throw new Error(`Component '${name}' has no input for ${formatKeys(unknown)}.`);
  }

  return Object.entries(values)
    .filter(([key]) => inputs.has(key))
    .map(([key, value]) => inputBinding(key, () => value));
}

/**
 * Creates input bindings only for the values whose key matches an input of the component. Used for placeholder and
 * error components, which may declare any subset of `node`, `definition`, and `error`.
 *
 * @param type Component class.
 * @param values Candidate values keyed by input template name.
 * @returns Bindings for the declared inputs.
 */
export function createOptionalBindings(type: Type<unknown>, values: Record<string, unknown>): Binding[] {
  const inputs = new Set(reflectComponentType(type)?.inputs.map((input) => input.templateName));
  return Object.entries(values)
    .filter(([key]) => inputs.has(key))
    .map(([key, value]) => inputBinding(key, () => value));
}

/**
 * Formats keys for error messages.
 *
 * @param keys Keys to format.
 * @returns The keys quoted and comma separated.
 */
function formatKeys(keys: string[]): string {
  return keys.map((key) => `'${key}'`).join(', ');
}
