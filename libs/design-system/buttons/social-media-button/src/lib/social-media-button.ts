import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import {
  DEFAULT_SOCIAL_MEDIA_BUTTON_DEFINITIONS,
  FALLBACK_SOCIAL_MEDIA_BUTTON_DEFINITION,
  SOCIAL_MEDIA_BUTTON_DEFINITIONS,
  type SocialMediaButtonDefinition,
} from './social-media-button-definitions';

@Component({
  selector: 'ang-social-media-button',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './social-media-button.html',
  styleUrl: './social-media-button.scss',
  providers: [provideEventScope('social-media-button')],
  host: { class: 'ang-social-media-button' },
})
export class SocialMediaButton {
  /** Identifier used to resolve a definition from injected or built-in sets. */
  readonly id = input<string>();

  /** Explicit definition with precedence over any `id`-based resolution. */
  readonly definition = input<SocialMediaButtonDefinition>();

  /** Resolved definition from either the explicit input or `id` lookup. */
  protected readonly resolvedDefinition = computed(() => {
    for (const definition of this.#getDefinitionCandidates()) {
      if (definition) {
        return definition;
      }
    }

    return FALLBACK_SOCIAL_MEDIA_BUTTON_DEFINITION;
  });

  /** Optional custom definitions provided via dependency injection. */
  readonly #definitions = inject(SOCIAL_MEDIA_BUTTON_DEFINITIONS, { optional: true });

  /**
   * Yields candidate definitions in precedence order:
   * 1) explicit `definition` input
   * 2) injected definition matching `id`
   * 3) built-in definition matching `id`
   *
   * In dev mode, missing inputs or unresolved `id` will throw.
   */
  *#getDefinitionCandidates(): Iterable<SocialMediaButtonDefinition | undefined> {
    yield this.definition();

    const id = this.id();
    if (!id) {
      if (typeof ngDevMode === 'undefined' || ngDevMode) {
        throw new Error('SocialMediaButton requires an id or definition input');
      }

      return;
    }

    yield this.#definitions?.find((definition) => definition.id === id);
    yield DEFAULT_SOCIAL_MEDIA_BUTTON_DEFINITIONS.find((definition) => definition.id === id);

    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      throw new Error(`No definition found for SocialMediaButton with id "${id}"`);
    }
  }
}
