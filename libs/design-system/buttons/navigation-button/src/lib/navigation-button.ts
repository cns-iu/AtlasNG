import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand, IdGenerator } from '@atlasng/common';

/**
 * Text button used in site navigation that links to another page in a new tab.
 * A visually hidden hint announces that the link opens in a new tab.
 * Clicks are tracked in the `navigation-button` analytics event scope.
 */
@Component({
  selector: 'ang-navigation-button',
  imports: [MatButtonModule, AnyLink, TrackClick],
  templateUrl: './navigation-button.html',
  styleUrl: './navigation-button.scss',
  providers: [provideEventScope('navigation-button')],
  host: {
    class: 'ang-navigation-button',
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class NavigationButton {
  /** The link to navigate to */
  readonly link = input<AnyLinkCommand>();

  /** Accessible name of the link. Defaults to the projected text. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Space-separated ids of elements describing the link, announced before the new-tab hint. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  /** Visually hidden hint announcing that the link opens in a new tab. */
  readonly newTabHint = input('Opens in a new tab');

  /** Id of the hint announcing that the link opens in a new tab. */
  protected readonly newTabHintId = inject(IdGenerator).getId('ang-navigation-button--new-tab-hint');

  /** Ids describing the link: the consumer's descriptions followed by the new-tab hint. */
  protected readonly describedby = computed(() =>
    [this.ariaDescribedby(), this.newTabHintId].filter(Boolean).join(' '),
  );
}
