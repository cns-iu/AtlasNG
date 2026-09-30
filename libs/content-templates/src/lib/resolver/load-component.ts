import { reflectComponentType, Type } from '@angular/core';
import { Promisable } from 'type-fest';
import { ComponentOrLoader, DefaultExport } from '../types/content-component-definition';

/**
 * Resolves a component class from a class or a lazy loader. Classes are recognized with `reflectComponentType`.
 *
 * @param loadable Component class or loader.
 * @returns The component class. Rejects when the loader does not resolve to a component.
 */
export async function loadComponent<T>(loadable: ComponentOrLoader<T>): Promise<Type<T>> {
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
