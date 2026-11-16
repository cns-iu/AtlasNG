import type { Provider } from '@angular/core';
import { createConfigurationToken, type, type LocalizedText } from '@atlasng/core';

/** User-facing text of the search field. */
export interface SearchFieldMessages {
  /** Label of the search field. Defaults to "Search". */
  label?: LocalizedText;
  /** Accessible label of the clear button. Defaults to "Clear search". */
  clearLabel?: LocalizedText;
}

/** Text of every search field below the injector. */
export const SEARCH_FIELD_MESSAGES = createConfigurationToken({
  name: 'SEARCH_FIELD_MESSAGES',
  config: type<SearchFieldMessages>(),
  defaults: () => ({ label: 'Search' as LocalizedText, clearLabel: 'Clear search' as LocalizedText }),
  inherit: true,
});

/**
 * Provides the text of every search field below the injector. Provided messages are merged over the parent's.
 *
 * @example
 * ```ts
 * provideSearchFieldMessages({ label: 'Rechercher', clearLabel: 'Effacer la recherche' });
 * ```
 *
 * @param messages Messages, or a factory run in an injection context that returns them.
 * @returns Provider for the messages.
 */
export function provideSearchFieldMessages(messages: SearchFieldMessages | (() => SearchFieldMessages)): Provider {
  return SEARCH_FIELD_MESSAGES.provide(messages);
}
