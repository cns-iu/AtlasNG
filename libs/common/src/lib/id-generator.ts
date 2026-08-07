import { APP_ID, inject, isDevMode, Service } from '@angular/core';
import { createConfigurationToken, type } from '@atlasng/core';

/**
 * Configures how IDs are composed by {@link IdGenerator}.
 */
export interface IdGeneratorConfig {
  /**
   * An infix to include in generated IDs.
   * If `true`, a random hexadecimal infix will be used.
   * If `false`, no infix will be included.
   */
  infix?: string | boolean;
}

/** Configuration definition. */
const ID_GENERATOR_CONFIG = createConfigurationToken({
  name: 'ID_GENERATOR_CONFIG',
  config: type<IdGeneratorConfig>(),
  defaults: () => ({
    // Enabled by default in production builds
    infix: !isDevMode(),
  }),
});

/**
 * Provides the {@link IdGeneratorConfig} for the application.
 *
 * @param config Configuration values to provide.
 * @returns Provider for the configuration.
 */
export const provideIdGeneratorConfig = ID_GENERATOR_CONFIG.provide;

/**
 * Generates stable, incrementing DOM-safe IDs.
 */
@Service()
export class IdGenerator {
  /** Configuration for the ID generator. */
  readonly config = ID_GENERATOR_CONFIG.inject();

  /** Angular application ID. */
  readonly #appId = inject(APP_ID);

  /** Infix for the ID generator or `false` when disabled. */
  readonly #infix = this.config.infix === true ? this.#getRandomInfix() : this.config.infix;

  /** Monotonic counter that guarantees uniqueness within this service instance. */
  #counter = 0;

  /**
   * Builds a unique ID using the provided prefix and generator configuration.
   *
   * @param prefix Prefix for the ID.
   * @returns A hyphen-delimited identifier.
   */
  getId(prefix: string): string {
    const parts = [prefix];

    if (this.#appId !== 'ng') {
      parts.push(this.#appId);
    }
    if (this.#infix) {
      parts.push(this.#infix);
    }

    parts.push(`${this.#counter++}`);
    return parts.join('-');
  }

  /**
   * Creates a random hexadecimal infix.
   */
  #getRandomInfix(): string {
    const RANDOM_INFIX_MAX = 0xffffff;
    const length = RANDOM_INFIX_MAX.toString(16).length;
    return Math.floor(RANDOM_INFIX_MAX * Math.random())
      .toString(16)
      .padStart(length, '0');
  }
}
