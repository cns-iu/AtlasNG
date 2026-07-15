import { assertInInjectionContext, inject, InjectionToken, Provider } from '@angular/core';

/**
 * Defines a configuration token and provides methods for injecting and providing configuration values.
 */
export interface ConfigDefinition<TConfig extends object> {
  /** Configuration token */
  token: InjectionToken<TConfig>;
  /** Injects the configuration with defaults applied */
  inject: () => Readonly<Required<TConfig>>;
  /** Provides a provider for the configuration */
  provide: (config: TConfig) => Provider;
}

/**
 * Injects a configuration value for the given token, applying defaults from the provided factory.
 *
 * @param token Configuration token to inject.
 * @param defaultsFactory Default configuration factory function.
 * @returns Resolved configuration value with defaults applied.
 */
export function injectConfig<TConfig extends object>(
  token: InjectionToken<TConfig>,
  defaultsFactory: () => Required<TConfig>,
): Readonly<Required<TConfig>> {
  assertInInjectionContext(injectConfig);

  const config = inject(token, { optional: true });
  const result = { ...defaultsFactory() };

  if (config) {
    for (const key in config) {
      const value = config[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Provides a configuration value for the given token.
 *
 * @param token Configuration token to provide.
 * @param config Configuration value to provide.
 * @returns Provider for the configuration.
 */
export function provideConfig<TConfig extends object>(token: InjectionToken<TConfig>, config: TConfig): Provider {
  return {
    provide: token,
    useValue: config,
  };
}

/**
 * Creates a configuration definition with a name and defaults.
 *
 * @param name Name for the configuration token.
 * @param defaultsFactory Default configuration factory function.
 * @returns Configuration definition.
 */
export function createConfigDefinition<TConfig extends object>(
  name: string,
  defaultsFactory: () => Required<TConfig>,
): ConfigDefinition<TConfig> {
  const token = new InjectionToken<TConfig>(name);
  return {
    token,
    inject: () => injectConfig(token, defaultsFactory),
    provide: (config: TConfig) => provideConfig(token, config),
  };
}
