import { APP_ID, inject, Injectable, InjectionToken } from '@angular/core';

/**
 * Configures how IDs are composed by {@link IdGenerator}.
 */
export interface IdGeneratorOptions {
  /**
   * Includes a random infix segment in generated IDs when enabled. (Enabled by default)
   */
  randomize?: boolean;
}

/** Maximum random value used to build the optional hexadecimal infix segment. */
const INFIX_MAX = 0xffffff;

/** Default configuration applied when no custom options are provided. */
const DEFAULT_GENERATOR_OPTIONS: Required<IdGeneratorOptions> = {
  randomize: true,
};

/** Dependency injection token for overriding {@link IdGenerator} options. */
export const ID_GENERATOR_OPTIONS = new InjectionToken<IdGeneratorOptions>('ID_GENERATOR_OPTIONS', {
  providedIn: 'root',
  factory: () => DEFAULT_GENERATOR_OPTIONS,
});

/**
 * Generates stable, incrementing DOM-safe IDs.
 */
@Injectable({
  providedIn: 'root',
})
export class IdGenerator {
  /** Angular application ID. */
  private readonly appId = inject(APP_ID);

  /** Effective generator options after merging defaults with user provided overrides. */
  private readonly options = { ...DEFAULT_GENERATOR_OPTIONS, ...inject(ID_GENERATOR_OPTIONS) };

  /** Random hexadecimal segment reused across generated IDs when randomization is enabled. */
  private readonly infix = Math.floor(INFIX_MAX * Math.random()).toString(16);

  /** Monotonic counter that guarantees uniqueness within this service instance. */
  private counter = 0;

  /**
   * Builds a unique ID using the provided prefix and generator configuration.
   *
   * @param prefix Prefix for the ID.
   * @returns A hyphen-delimited identifier.
   */
  getId(prefix: string): string {
    const parts = [prefix];

    if (this.appId !== 'ng') {
      parts.push(this.appId);
    }
    if (this.options.randomize) {
      parts.push(this.infix);
    }

    parts.push(`${this.counter++}`);
    return parts.join('-');
  }
}
