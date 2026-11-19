import { EnvironmentProviders, Provider } from '@angular/core';
import { AngError } from './errors';

/**
 * A feature passed to a `provideX(...features)` function: a kind that identifies the `withX` function that created
 * it, and the providers it contributes.
 */
export interface Feature<K, P extends Provider | EnvironmentProviders = Provider | EnvironmentProviders> {
  /** Kind of the feature. */
  readonly kind: K;
  /** Providers contributed by the feature. */
  readonly providers: P[];
}

/**
 * Throws if more than one of the features has one of the given kinds, e.g. when two features each provide an engine.
 *
 * Guard the call with `typeof ngDevMode === 'undefined' || ngDevMode` so production builds drop the check and its
 * message.
 *
 * @param features Features passed to the `provideX` function.
 * @param kinds Kinds of which at most one feature may be given.
 * @param code Error code of the thrown error.
 * @param message Dev-mode message of the thrown error.
 * @throws {AngError} If more than one of the features has one of the kinds.
 */
export function assertSingleFeature<K, C extends number>(
  features: readonly Feature<K>[],
  kinds: readonly K[],
  code: C,
  message?: string | false | null,
): void {
  if (features.filter((feature) => kinds.includes(feature.kind)).length > 1) {
    throw new AngError(code, message);
  }
}
