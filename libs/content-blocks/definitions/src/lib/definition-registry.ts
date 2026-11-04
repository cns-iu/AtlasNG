import { inject, InjectionToken, Injector, Service } from '@angular/core';
import { ContentDefinition } from '@atlasng/content-blocks/types';
import { LazyChainedRegistry } from '@atlasng/content-blocks/utils';
import { Promisable } from 'type-fest';

/**
 * Multi token collecting definition factories keyed by registered name. Each factory runs once, on first use, in the
 * environment injection context, and may load the definition lazily.
 */
export const DEFINITIONS = new InjectionToken<Record<string, () => Promisable<ContentDefinition>>[]>('DEFINITIONS');

/**
 * Resolves content definitions by name.
 *
 * Provided by `provideDefinitions`. Names not registered in this injector are looked up in the registry of a parent
 * environment injector, if any. A registered name acts as an alias for the definition and may differ from its `name`.
 */
@Service()
export class DefinitionRegistry extends LazyChainedRegistry<ContentDefinition> {
  /** Collects the factories registered in this injector. */
  constructor() {
    super(
      inject(Injector),
      inject(DefinitionRegistry, { optional: true, skipSelf: true }),
      inject(DEFINITIONS, { optional: true }),
    );
  }
}
