import { inject, Injectable } from '@angular/core';
import { ContentComponentDefinition } from '../types/content-component-definition';
import { mergeEntries, unknownNameError } from './registry-utils';
import { CONTENT_COMPONENT_DEFINITIONS, ContentComponentDefinitionEntry } from './tokens';

/**
 * Resolves component definitions by name.
 *
 * Provided by `provideContentTemplates`. Names not registered in this injector are looked up in the registry of a
 * parent environment injector, if any. Lazy definitions are loaded once and cached.
 */
@Injectable()
export class ContentDefinitionRegistry {
  /** Registry of a parent environment injector, used for names not registered here. */
  readonly #parent = inject(ContentDefinitionRegistry, { optional: true, skipSelf: true });
  /** Registered definition entries. */
  readonly #entries = mergeEntries('component definition', inject(CONTENT_COMPONENT_DEFINITIONS));
  /** Resolved or in-flight definitions. */
  readonly #definitions = new Map<string, Promise<ContentComponentDefinition>>();

  /**
   * Resolves a component definition, loading it first when registered lazily.
   *
   * A failed lazy load is not cached, so a later call retries it.
   *
   * @param name Definition name, as used in `ContentElementNode.component`.
   * @returns The definition. Rejects when no definition is registered under `name`, or a lazy definition's `name`
   *   differs from its registered name.
   */
  get(name: string): Promise<ContentComponentDefinition> {
    const entry = this.#entries.get(name);
    if (entry === undefined) {
      return this.#parent?.get(name) ?? Promise.reject(unknownNameError('component definition', name));
    }

    let definition = this.#definitions.get(name);
    if (definition === undefined) {
      definition = this.#load(name, entry);
      definition.catch(() => this.#definitions.delete(name));
      this.#definitions.set(name, definition);
    }

    return definition;
  }

  /**
   * Resolves a definition entry and checks that its name matches the registered name.
   *
   * @param name Registered name.
   * @param entry Definition or lazy loader.
   * @returns The definition. Rejects when its `name` differs from `name`.
   */
  async #load(name: string, entry: ContentComponentDefinitionEntry): Promise<ContentComponentDefinition> {
    const definition = typeof entry === 'function' ? await entry() : entry;
    if (definition.name !== name) {
      throw new Error(`Component definition registered as '${name}' is named '${definition.name}'.`);
    }

    return definition;
  }
}
