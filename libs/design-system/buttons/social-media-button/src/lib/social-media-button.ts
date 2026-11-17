import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AngError } from '@atlasng/core';
import { DesignSystemErrorCode } from '@atlasng/design-system/errors';
import {
  DEFAULT_SOCIAL_MEDIA_BUTTON_DEFINITIONS,
  FALLBACK_SOCIAL_MEDIA_BUTTON_DEFINITION,
  SOCIAL_MEDIA_BUTTON_DEFINITIONS,
  type SocialMediaButtonDefinition,
} from './social-media-button-definitions';

/**
 * Icon link to a social media profile.
 *
 * The link, label, and icon come from `social`: either an explicit definition, or the id of a
 * definition in the injected {@link SOCIAL_MEDIA_BUTTON_DEFINITIONS} or the built-in set.
 */
@Component({
  selector: 'ang-social-media-button',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './social-media-button.html',
  styleUrl: './social-media-button.scss',
  providers: [provideEventScope('social-media-button')],
  host: { class: 'ang-social-media-button' },
})
export class SocialMediaButton {
  /** Explicit definition, or the id of a definition resolved from the injected or built-in sets. */
  readonly social = input.required<string | SocialMediaButtonDefinition>();

  /** Resolved definition from either the explicit definition or the id lookup. */
  protected readonly resolvedDefinition = computed(() => {
    const social = this.social();
    if (typeof social !== 'string') {
      return social;
    }

    return this.#findDefinition(social) ?? FALLBACK_SOCIAL_MEDIA_BUTTON_DEFINITION;
  });

  /** Optional groups of custom definitions provided via dependency injection. */
  readonly #definitionGroups = inject(SOCIAL_MEDIA_BUTTON_DEFINITIONS, { optional: true }) ?? [];

  /**
   * Finds the definition for an id: the last injected match, then the built-in match.
   *
   * @param id Id of the definition to find.
   * @returns Matching definition, or undefined in production mode when none matches.
   * @throws AngError In dev mode when no definition matches the id.
   */
  #findDefinition(id: string): SocialMediaButtonDefinition | undefined {
    for (let index = this.#definitionGroups.length - 1; index >= 0; index--) {
      const definition = this.#definitionGroups[index].findLast((candidate) => candidate.id === id);
      if (definition) {
        return definition;
      }
    }

    const definition = DEFAULT_SOCIAL_MEDIA_BUTTON_DEFINITIONS.find((candidate) => candidate.id === id);
    if (!definition && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw new AngError(
        DesignSystemErrorCode.UnknownSocialMediaButtonId,
        `No definition found for SocialMediaButton with id "${id}"`,
      );
    }

    return definition;
  }
}
