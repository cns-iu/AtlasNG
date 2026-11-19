import { assertInInjectionContext, inject, Injector } from '@angular/core';

/** Options for functions that must run in an injection context unless an injector is provided. */
export interface InjectorOptions {
  /** Injector used outside an injection context. */
  injector?: Injector;
}

/**
 * Resolves the injector of an `injectX` style function: the provided injector, or the injector of the current
 * injection context.
 *
 * @param fn Function that needs the injector, named in the error thrown outside an injection context.
 * @param options Options that may provide an injector.
 * @returns The provided injector or the current context's injector.
 * @throws If no injector is provided and the call is outside an injection context.
 * @example
 * export function injectThing(options?: InjectorOptions): Thing {
 *   const injector = resolveInjector(injectThing, options);
 *   return injector.get(Thing);
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- matches assertInInjectionContext
export function resolveInjector(fn: Function, options?: InjectorOptions): Injector {
  if (options?.injector) {
    return options.injector;
  }

  assertInInjectionContext(fn);
  return inject(Injector);
}
