import { EnvironmentInjector, inject, runInInjectionContext } from '@angular/core';
import { Promisable } from 'type-fest';

/**
 * Base class for registries that resolve values by name from factories.
 *
 * Each factory runs once, on first use, in the environment injection context, and its result is cached. Names not
 * registered here are looked up in the parent registry, if any, and the parent's result is cached as well. Rejections
 * are cached too, so a failed factory is not retried.
 */
export abstract class ContentRegistry<T> {
  /** Injector in which factories run. */
  readonly #injector = inject(EnvironmentInjector);
  /** Registry of a parent environment injector, used for names not registered here. */
  readonly #parent: ContentRegistry<T> | null;
  /** Registered factories keyed by name. */
  readonly #entries: Map<string, () => Promisable<T>>;
  /** Created or in-flight instances keyed by name. */
  readonly #instances = new Map<string, Promise<T>>();

  /**
   * Creates the registry. Must be called in an injection context.
   *
   * @param parent Registry used for names not registered here, or `null`.
   * @param entries Factories keyed by name. A later entry replaces an earlier one with the same name.
   */
  protected constructor(parent: ContentRegistry<T> | null, entries: Iterable<[string, () => Promisable<T>]>) {
    this.#parent = parent;
    this.#entries = new Map(entries);
  }

  /**
   * Resolves a value, creating it on first use.
   *
   * @param name Registered name.
   * @returns The value. Rejects when no factory is registered under `name` here or in a parent, or the factory fails.
   */
  get(name: string): Promise<T> {
    let instance = this.#instances.get(name);
    if (instance === undefined) {
      instance = this.#createInstance(name);
      this.#instances.set(name, instance);
    }

    return instance;
  }

  /**
   * Runs the factory registered under `name`, or delegates to the parent registry.
   *
   * @param name Registered name.
   * @returns The value.
   * @throws When no factory is registered under `name` and there is no parent registry.
   */
  async #createInstance(name: string): Promise<T> {
    const factory = this.#entries.get(name);
    if (factory === undefined) {
      if (this.#parent) {
        return this.#parent.get(name);
      }
      throw new Error(`Unknown registry entry '${name}'.`);
    }

    return runInInjectionContext(this.#injector, factory);
  }
}
