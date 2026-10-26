import { Type } from '@angular/core';
import { Promisable } from 'type-fest';

/** Module shape of a lazy import whose value is the default export. */
export interface DefaultExport<T> {
  /** The default exported value. */
  default: T;
}

/**
 * A component class, or a loader resolving to the class or to a module that default exports it.
 * Classes and loaders are told apart with `reflectComponentType`.
 */
export type TypeRef<T> = Type<T> | (() => Promisable<Type<T> | DefaultExport<Type<T>>>);
