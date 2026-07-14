import { assertInInjectionContext, inject, InjectionToken, Provider } from '@angular/core';

/**
 * Defines a configuration token and provides methods for injecting and providing configuration values.
 */
export interface ConfigDefinition<T extends object> {
  /** Configuration token */
  token: InjectionToken<T>;
  /** Injects the configuration with defaults applied */
  inject: () => Required<T>;
  /** Provides a provider for the configuration */
  provide: (config: T) => Provider;
}

/**
 * Injects a configuration value for the given token, applying defaults from the provided factory.
 *
 * @param token Configuration token to inject.
 * @param defaultsFactory Default configuration factory function.
 * @returns Resolved configuration value with defaults applied.
 */
export function injectConfig<T extends object>(
  token: InjectionToken<T>,
  defaultsFactory: () => Required<T>,
): Required<T> {
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
export function provideConfig<T extends object>(token: InjectionToken<T>, config: T): Provider {
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
export function createConfigDefinition<T extends object>(
  name: string,
  defaultsFactory: () => Required<T>,
): ConfigDefinition<T> {
  const token = new InjectionToken<T>(name);
  return {
    token,
    inject: () => injectConfig(token, defaultsFactory),
    provide: (config: T) => provideConfig(token, config),
  };
}
