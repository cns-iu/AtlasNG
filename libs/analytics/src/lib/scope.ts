import { computed, Directive, forwardRef, inject, InjectionToken, input, Provider } from '@angular/core';
import { ANALYTICS_CONFIG } from './analytics';

/**
 * An analytics event scope for grouping events.
 *
 * Scopes can be defined via providers at the component level or
 * in the template by using the `EventScope` directive.
 * To get the current scope, inject the `EVENT_SCOPE` token.
 */
export interface IEventScope {
  /** Scope name */
  readonly name: () => string;
  /** Fully qualified dot-separated scope path */
  readonly path: () => string;
  /** Parent scope in the hierarchy, or `null` for the root scope */
  readonly parentScope: IEventScope | null;
}

/**
 * Injection token for the local event scope.
 */
export const EVENT_SCOPE = new InjectionToken<IEventScope>('EVENT_SCOPE', {
  providedIn: 'root',
  factory: () => {
    const { rootScope, appName } = inject(ANALYTICS_CONFIG);
    return new StaticEventScope(rootScope ?? appName ?? '', null);
  },
});

/**
 * Injection token for scope entries collected from providers in the current injector.
 */
const EVENT_SCOPE_ENTRIES = new InjectionToken<(string | IEventScope)[]>('EVENT_SCOPE_ENTRIES');

/**
 * Builds a full scope path from the parent scope path and current name.
 */
function buildPath(parent: IEventScope | null, name: () => string): string {
  const parentPath = parent?.path();
  return parentPath ? `${parentPath}.${name()}` : name();
}

/**
 * Resolves the active scope by combining the inherited parent scope with
 * local scope entries registered in the current injector.
 */
function buildEventScope(): IEventScope {
  const parentScope = inject(EVENT_SCOPE, { skipSelf: true });
  const entries = inject(EVENT_SCOPE_ENTRIES, { self: true });
  const names = entries.filter((entry) => typeof entry === 'string').reverse();
  const scope = entries.find((entry) => typeof entry !== 'string');
  return names.reduce((currentScope, name) => new StaticEventScope(name, currentScope), scope ?? parentScope);
}

/**
 * Registers a new scope with the specified name for the current provider scope.
 *
 * @param name The scope name
 */
export function provideEventScope(name: string): Provider[] {
  return [
    {
      provide: EVENT_SCOPE_ENTRIES,
      useValue: name,
      multi: true,
    },
    {
      provide: EVENT_SCOPE,
      useFactory: buildEventScope,
    },
  ];
}

/**
 * Directive for creating a new event scope directly in the template.
 *
 * If applied to a component that defines its own scope via providers,
 * this scope becomes the parent scope for the component scope.
 *
 * ```html
 * <app-component-with-scope angEventScope="directive">
 *   <!-- Scope path: "directive.component" -->
 * </app-component-with-scope>
 * ```
 */
@Directive({
  selector: '[angEventScope]',
  providers: [
    {
      provide: EVENT_SCOPE_ENTRIES,
      useExisting: forwardRef(() => EventScope),
      multi: true,
    },
    {
      provide: EVENT_SCOPE,
      useFactory: buildEventScope,
    },
  ],
  exportAs: 'angEventScope',
})
export class EventScope implements IEventScope {
  /** Scope name */
  readonly name = input.required<string>({ alias: 'angEventScope' });
  /** Parent scope */
  readonly parentScope = inject(EVENT_SCOPE, { skipSelf: true });
  /** Fully qualified scope path */
  readonly path = computed(() => buildPath(this.parentScope, this.name));
}

/**
 * Scope node with a static name, used for the root scope and scopes registered via providers.
 */
class StaticEventScope implements IEventScope {
  /** Scope name */
  readonly name: () => string;
  /** Parent scope */
  readonly parentScope: IEventScope | null;
  /** Fully qualified scope path */
  readonly path = computed(() => buildPath(this.parentScope, this.name));

  /**
   * Creates a static scope node.
   *
   * @param name Scope name
   * @param parentScope Parent scope node, or `null` for root
   */
  constructor(name: string, parentScope: IEventScope | null) {
    this.name = () => name;
    this.parentScope = parentScope;
  }
}
