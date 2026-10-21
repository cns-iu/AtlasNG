import { Injector, runInInjectionContext } from '@angular/core';
import { Promisable } from 'type-fest';

/**
 * Base class for registries that lazily resolve values by name from factories, chained to a parent registry.
 *
 * Each factory runs once, on first use, in the environment injection context, and its result is cached. Names not
 * registered here are looked up in the parent registry, if any, and the parent's result is cached as well. Rejections
 * are cached too, so a failed factory is not retried until its cached result is dropped with {@link reset} or
 * {@link clear}.
 */
export abstract class LazyChainedRegistry<T> {
  /** Injector in which factories run. */
  readonly #injector: Injector;
  /** Registry of a parent environment injector, used for names not registered here, or `null` for a root registry. */
  readonly #parent: LazyChainedRegistry<T> | undefined | null;
  /** Registered factories keyed by name. */
  readonly #entries: Map<string, () => Promisable<T>>;
  /** Created or in-flight instances keyed by name. */
  readonly #instances = new Map<string, Promise<T>>();

  /**
   * Creates the registry.
   *
   * @param injector Injector in which factories run.
   * @param parent Registry used for names not registered here, or `null`.
   * @param entries Factories as `[name, factory]` pairs or records keyed by name. A later entry replaces an earlier
   *   one with the same name.
   */
  protected constructor(
    injector: Injector,
    parent?: LazyChainedRegistry<T> | null,
    entries?: Iterable<[string, () => Promisable<T>]> | Iterable<Record<string, () => Promisable<T>>> | null,
  ) {
    this.#injector = injector;
    this.#parent = parent;
    this.#entries = new Map(entries ? flattenEntries(entries) : []);
  }

  /**
   * Checks whether a factory is registered under a name, here or in a parent. Does not run the factory, so a name can
   * be registered even though its {@link get} would reject.
   *
   * @param name Registered name.
   * @returns Whether {@link get} returns a value instead of `undefined` for `name`.
   */
  has(name: string): boolean {
    return this.#entries.has(name) || this.#parent?.has(name) === true;
  }

  /**
   * Resolves a value, creating it on first use.
   *
   * @param name Registered name.
   * @returns The value, rejecting when the factory fails, or `undefined` when no factory is registered under `name`
   *   here or in a parent. Misses are not cached.
   */
  get(name: string): Promise<T> | undefined {
    let instance = this.#instances.get(name);
    if (instance === undefined) {
      instance = this.#createInstance(name);
      if (instance) {
        this.#instances.set(name, instance);
      }
    }

    return instance;
  }

  /**
   * Drops the cached value for a name, so the next {@link get} runs its factory again, e.g. to retry after a failure.
   *
   * By default only this registry's cache is affected: for a name resolved through the parent, the next `get` asks the
   * parent again, which returns its own cached value. Pass `recursive` to reset the name in every ancestor as well. A
   * value still in flight keeps resolving for callers that already hold it. Does nothing when no value is cached under
   * `name`.
   *
   * @param name Registered name.
   * @param options Reset options.
   * @param options.recursive Also reset the name in the parent registry and its ancestors. Defaults to `false`.
   */
  reset(name: string, options?: { recursive?: boolean }): void {
    this.#instances.delete(name);
    if (options?.recursive) {
      this.#parent?.reset(name, options);
    }
  }

  /**
   * Drops all cached values, as if {@link reset} were called for every name. By default the parent registry's cache is
   * not affected; pass `recursive` to clear every ancestor as well.
   *
   * @param options Reset options.
   * @param options.recursive Also clear the parent registry and its ancestors. Defaults to `false`.
   */
  clear(options?: { recursive?: boolean }): void {
    this.#instances.clear();
    if (options?.recursive) {
      this.#parent?.clear(options);
    }
  }

  /**
   * Runs the factory registered under `name`, or delegates to the parent registry.
   *
   * @param name Registered name.
   * @returns The value, or `undefined` when no factory is registered under `name` here or in a parent.
   */
  #createInstance(name: string): Promise<T> | undefined {
    const factory = this.#entries.get(name);
    if (factory === undefined) {
      return this.#parent?.get(name);
    }

    return new Promise<T>((resolve) => resolve(runInInjectionContext(this.#injector, factory)));
  }
}

function* flattenEntries<T>(
  entries: Iterable<[string, () => Promisable<T>]> | Iterable<Record<string, () => Promisable<T>>>,
): Generator<[string, () => Promisable<T>]> {
  for (const entry of entries) {
    if (Array.isArray(entry)) {
      yield entry;
    } else {
      for (const [name, factory] of Object.entries(entry)) {
        yield [name, factory] as const;
      }
    }
  }
}
