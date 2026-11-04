import { Provider } from '@angular/core';
import { ContentDefinition } from '@atlasng/content-blocks/types';
import { Promisable } from 'type-fest';
import { DEFINITIONS, DefinitionRegistry } from './definition-registry';

/**
 * Registers content definitions and provides a {@link DefinitionRegistry} for the environment injector.
 *
 * An array registers each definition under its `name`. A record registers factories under their keys; a factory runs
 * once, on first use, in the environment injection context, and may load the definition lazily. A key acts as an alias
 * and may differ from the definition's `name`. Names not registered in this injector are resolved through the registry
 * of a parent environment injector, so routes can add definitions on top of the application's.
 *
 * @param definitions Definitions, or definition factories keyed by registered name.
 * @returns Providers to add to application or route providers.
 */
export function provideDefinitions(
  definitions: ContentDefinition[] | Record<string, () => Promisable<ContentDefinition>>,
): Provider {
  return [
    {
      provide: DEFINITIONS,
      useValue: toDefinitionFactories(definitions),
      multi: true,
    },
    DefinitionRegistry,
  ];
}

function toDefinitionFactories(
  definitions: ContentDefinition[] | Record<string, () => Promisable<ContentDefinition>>,
): Record<string, () => Promisable<ContentDefinition>> {
  if (!Array.isArray(definitions)) {
    return definitions;
  }

  const entries = definitions.map((definition) => [definition.name, () => definition] as const);
  return Object.fromEntries(entries);
}
