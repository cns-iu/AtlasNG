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

export class TemplateDefinitionCache<TContext, TConfig> {
  readonly #appRef = inject(ApplicationRef);
  readonly #environmentInjector = inject(EnvironmentInjector);
  readonly #injector = inject(Injector);

  readonly #definitions = new Map<object, ComponentRef<TableTemplateDefinition<TContext, TConfig>>>();
  readonly #marked = new Set<object>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clear());
  }

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

  sweep(): void {
    for (const [key, ref] of this.#definitions) {
      if (!this.#marked.has(key)) {
        ref.destroy();
        this.#definitions.delete(key);
      }
    }

    this.#marked.clear();
  }

  clear(): void {
    for (const ref of this.#definitions.values()) {
      ref.destroy();
    }

    this.#definitions.clear();
    this.#marked.clear();
  }

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
