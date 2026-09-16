import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  DestroyRef,
  EnvironmentInjector,
  inject,
  Injector,
  TemplateRef,
  Type,
} from '@angular/core';
import { TABLE_TEMPLATE_DEFINITION_CONFIG, TableTemplateDefinition } from './template-definition';

/**
 * Owns dynamically created table-template definitions for one template kind.
 *
 * Entries are keyed by column identity. Reusing a key retains the definition's
 * original type and configuration until the entry is swept or cleared.
 *
 * @typeParam TContext Context supplied to cached embedded templates.
 * @typeParam TConfig Configuration injected into cached definitions.
 */
export class TemplateDefinitionCache<TContext, TConfig> {
  /** Application used to attach dynamically created definition views. */
  readonly #appRef = inject(ApplicationRef);

  /** Environment inherited by dynamically created definitions. */
  readonly #environmentInjector = inject(EnvironmentInjector);

  /** Parent injector used for definition-specific child injectors. */
  readonly #injector = inject(Injector);

  /** Cached definition component references indexed by column identity. */
  readonly #definitions = new Map<object, ComponentRef<TableTemplateDefinition<TContext, TConfig>>>();

  /** Keys accessed during the current resolution cycle. */
  readonly #marked = new Set<object>();

  /** Creates a cache that clears all definitions with its injection context. */
  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

  /**
   * Returns the template cached for a key or creates its definition component.
   *
   * A cache hit marks the entry as active but does not replace its original
   * definition type or injected configuration.
   *
   * @param key Stable identity used to cache and mark the definition.
   * @param type Component type created for a cache miss.
   * @param config Configuration injected into a newly created definition.
   * @returns Template exposed by the cached definition.
   */
  getOrCreate(
    key: object,
    type: Type<TableTemplateDefinition<TContext, TConfig>>,
    config: TConfig,
  ): TemplateRef<TContext> {
    this.#marked.add(key);

    let ref = this.#definitions.get(key);
    if (!ref) {
      ref = this.#createDefinition(type, config);
      this.#definitions.set(key, ref);
    }

    return ref.instance.template();
  }

  /** Destroys entries not accessed since the previous sweep and resets all marks. */
  sweep(): void {
    for (const [key, ref] of this.#definitions) {
      if (!this.#marked.has(key)) {
        ref.destroy();
        this.#definitions.delete(key);
      }
    }

    this.#marked.clear();
  }

  /** Destroys every cached definition and resets the cache. */
  clear(): void {
    for (const ref of this.#definitions.values()) {
      ref.destroy();
    }

    this.#definitions.clear();
    this.#marked.clear();
  }

  /**
   * Creates, attaches, and initializes a definition component.
   *
   * @param type Definition component type to create.
   * @param config Configuration made available through the definition token.
   * @returns Initialized component reference owned by this cache.
   */
  #createDefinition(
    type: Type<TableTemplateDefinition<TContext, TConfig>>,
    config: TConfig,
  ): ComponentRef<TableTemplateDefinition<TContext, TConfig>> {
    const injector = Injector.create({
      parent: this.#injector,
      providers: [{ provide: TABLE_TEMPLATE_DEFINITION_CONFIG, useValue: config }],
    });
    const ref = createComponent(type, {
      environmentInjector: this.#environmentInjector,
      elementInjector: injector,
    });

    this.#appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    ref.onDestroy(() => injector.destroy());

    return ref;
  }
}
