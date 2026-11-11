import { InjectionToken, Provider } from '@angular/core';

/** Configuration of the knowledge graph explorer. */
export interface KgExplorerConfig {
  /** Maximum number of autocomplete suggestions shown below the search field. */
  maxSuggestions: number;
}

/** Default knowledge graph explorer configuration. */
export const DEFAULT_KG_EXPLORER_CONFIG: KgExplorerConfig = {
  maxSuggestions: 8,
};

/** Knowledge graph explorer configuration. Defaults to {@link DEFAULT_KG_EXPLORER_CONFIG}. */
export const KG_EXPLORER_CONFIG = new InjectionToken<KgExplorerConfig>('KG_EXPLORER_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_KG_EXPLORER_CONFIG,
});

/**
 * Provides the knowledge graph explorer configuration.
 *
 * @param config Configuration values; omitted values use {@link DEFAULT_KG_EXPLORER_CONFIG}.
 * @returns A provider for {@link KG_EXPLORER_CONFIG}.
 */
export function provideKgExplorerConfig(config: Partial<KgExplorerConfig>): Provider {
  return {
    provide: KG_EXPLORER_CONFIG,
    useValue: { ...DEFAULT_KG_EXPLORER_CONFIG, ...config },
  };
}
