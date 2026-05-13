import {
  ComponentRef,
  createComponent,
  DestroyRef,
  EnvironmentInjector,
  inject,
  Injectable,
  Type,
} from '@angular/core';

/**
 * Service to load stylesheets dynamically into the application.
 * Used to load shared and/or directive associated stylesheets.
 *
 * This code was adapted from an internal Angular CDK service.
 * The original code can be found at: {@link https://github.com/angular/components/blob/v21.2.10/src/cdk/private/style-loader.ts}
 */
@Injectable({
  providedIn: 'root',
})
export class StyleLoader {
  /** Reference to the environment injector. */
  private readonly environmentInjector = inject(EnvironmentInjector);
  /** Set of loaded style provider components. */
  private readonly loaders = new Set<Type<unknown>>();
  /** List of created component references. */
  private readonly refs: ComponentRef<unknown>[] = [];

  /**
   * Initialize the style loader and register cleanup logic.
   */
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.refs.forEach((ref) => ref.destroy());
    });
  }

  /**
   * Loads a stylesheet component if it hasn't been loaded already.
   *
   * @param loader Style provider component to load.
   */
  load(loader: Type<unknown>): void {
    if (!this.loaders.has(loader)) {
      const ref = createComponent(loader, { environmentInjector: this.environmentInjector });
      this.loaders.add(loader);
      this.refs.push(ref);
    }
  }
}
