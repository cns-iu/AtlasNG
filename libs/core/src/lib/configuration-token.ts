import { assertInInjectionContext, inject, InjectionToken, Provider } from '@angular/core';
import { Simplify } from 'type-fest';

/**
 * Resolves a configuration type by requiring the properties supplied by its defaults.
 */
export type ConfigurationWithDefaults<TConfig extends object, TDefaults extends Partial<TConfig>> = Simplify<
  Readonly<Omit<TConfig, keyof TDefaults> & Required<Pick<TConfig, keyof TDefaults & keyof TConfig>>>
>;

/**
 * Options used to create a {@link ConfigurationToken}.
 */
export interface ConfigurationTokenOptions<TConfig extends object, TDefaults extends Partial<TConfig>> {
  /** Name for the underlying Angular injection token. */
  name: string;
  /** Type witness for the complete configuration shape. */
  config: TConfig;
  /** Factory for the default configuration subset. */
  defaults: () => TDefaults;
  /**
   * Whether a provided configuration is merged over the configuration provided by a parent injector, so that a nested
   * provider only sets the properties it changes. Defaults to `false`: a provided configuration replaces its parent's.
   */
  inherit?: boolean;
}

/**
 * An Angular configuration token with methods for injection and provisioning.
 */
export interface ConfigurationToken<TConfig extends object, TDefaults extends Partial<TConfig>> {
  /** Underlying Angular injection token. */
  token: InjectionToken<TConfig>;
  /** Injects the configuration with defaults applied. */
  inject: () => ConfigurationWithDefaults<TConfig, TDefaults>;
  /** Creates a provider for configuration overrides. */
  provide: (config: TConfig) => Provider;
}

/**
 * Resolves the configuration type a {@link ConfigurationToken} injects, i.e. its configuration with the defaulted
 * properties required.
 *
 * @example
 * ```ts
 * const config: ConfigurationOf<typeof MY_CONFIG> = MY_CONFIG.inject();
 * ```
 */
export type ConfigurationOf<TToken extends ConfigurationToken<object, object>> = ReturnType<TToken['inject']>;

/**
 * Produces a type witness for APIs that need a generic type inferred from a value.
 *
 * The returned value is only intended for type inference and must not be read at runtime.
 *
 * @returns An undefined runtime value typed as {@link T}.
 */
export function type<T>(): T {
  return undefined as T;
}

/**
 * Creates an Angular configuration token with inferred defaults.
 *
 * @param options Token name, complete configuration type witness, and defaults factory.
 * @returns Configuration token with methods for injection and provisioning.
 */
export function createConfigurationToken<TConfig extends object, const TDefaults extends Partial<TConfig>>(
  options: ConfigurationTokenOptions<TConfig, TDefaults>,
): ConfigurationToken<TConfig, TDefaults> {
  const token = new InjectionToken<TConfig>(options.name);

  /** Injects and resolves the configuration associated with this token. */
  function injectConfiguration(): ConfigurationWithDefaults<TConfig, TDefaults> {
    assertInInjectionContext(injectConfiguration);

    const config = inject(token, { optional: true });
    const result = mergeDefined<Partial<TConfig>>(options.defaults(), config);

    return result as ConfigurationWithDefaults<TConfig, TDefaults>;
  }

  /** Creates a provider for this token. */
  function provideConfiguration(config: TConfig): Provider {
    if (options.inherit) {
      return {
        provide: token,
        useFactory: () => mergeDefined(inject(token, { optional: true, skipSelf: true }) ?? {}, config) as TConfig,
      };
    }

    return {
      provide: token,
      useValue: config,
    };
  }

  return {
    token,
    inject: injectConfiguration,
    provide: provideConfiguration,
  };
}

/**
 * Merges the defined properties of an object over a copy of another. Properties whose value is `undefined` do not
 * override the base value.
 *
 * @param base Object providing the initial values. It is not mutated.
 * @param overrides Object whose defined properties replace the base values.
 * @returns A new object with the merged properties.
 */
function mergeDefined<T extends object>(base: T, overrides: Partial<T> | null | undefined): T {
  const result = { ...base };

  if (overrides) {
    for (const key in overrides) {
      const value = overrides[key];
      if (value !== undefined) {
        result[key] = value as T[typeof key];
      }
    }
  }

  return result;
}
