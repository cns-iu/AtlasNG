import { inject, Injectable, InjectionToken } from '@angular/core';
import { Promisable } from 'type-fest';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { ContentRegistry } from './content-registry';

/** Creates or lazily loads a component definition. Runs once, on first use, in the environment injection context. */
export type ContentComponentDefinitionFactory = () => Promisable<ContentComponentDefinition>;

/** Multi token collecting component definition factories keyed by registered name. */
export const CONTENT_COMPONENT_DEFINITIONS = new InjectionToken<Record<string, ContentComponentDefinitionFactory>[]>(
  'CONTENT_COMPONENT_DEFINITIONS',
);

/**
 * Resolves component definitions by name.
 *
 * Provided by `provideContentTemplates`. Names not registered in this injector are looked up in the registry of a
 * parent environment injector, if any. A registered name acts as an alias for the definition and may differ from its
 * `name`.
 */
@Injectable()
export class ContentDefinitionRegistry extends ContentRegistry<ContentComponentDefinition> {
  /** Collects the factories registered in this injector. */
  constructor() {
    super(
      inject(ContentDefinitionRegistry, { optional: true, skipSelf: true }),
      inject(CONTENT_COMPONENT_DEFINITIONS).flatMap((record) => Object.entries(record)),
    );
  }
}
