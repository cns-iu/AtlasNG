import type { LiveAnnouncerDefaultOptions } from '@angular/cdk/a11y';
import type { Provider } from '@angular/core';
import { createConfigurationToken, type } from '@atlasng/core';

/**
 * Defaults of the {@link Announce} directive. `politeness` and `duration` fall back to the `LiveAnnouncer` defaults,
 * including any provided with `LIVE_ANNOUNCER_DEFAULT_OPTIONS`.
 */
export interface AnnounceConfig extends LiveAnnouncerDefaultOptions {
  /** Milliseconds the text has to stay the same before it is announced. Defaults to `1000`. */
  delay?: number;
}

/** Defaults of every {@link Announce} directive below the injector. */
export const ANNOUNCE_CONFIG = createConfigurationToken({
  name: 'ANNOUNCE_CONFIG',
  config: type<AnnounceConfig>(),
  defaults: () => ({ delay: 1000 }),
  inherit: true,
});

/**
 * Provides the defaults of every {@link Announce} directive below the injector. Provided values are merged over the
 * parent's.
 *
 * @example
 * ```ts
 * provideAnnounceConfig({ delay: 500, politeness: 'assertive' });
 * ```
 *
 * @param config Defaults, or a factory run in an injection context that returns them.
 * @returns Provider for the defaults.
 */
export function provideAnnounceConfig(config: AnnounceConfig | (() => AnnounceConfig)): Provider {
  return ANNOUNCE_CONFIG.provide(config);
}
