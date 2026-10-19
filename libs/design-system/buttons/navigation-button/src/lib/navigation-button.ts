import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';

/**
 * Text button used in site navigation that links to another page.
 * Clicks are tracked in the `navigation-button` analytics event scope.
 */
@Component({
  selector: 'ang-navigation-button',
  imports: [MatButtonModule, AnyLink, TrackClick],
  templateUrl: './navigation-button.html',
  styleUrl: './navigation-button.scss',
  providers: [provideEventScope('navigation-button')],
  host: { class: 'ang-navigation-button' },
})
export class NavigationButton {
  /** The link to navigate to */
  readonly link = input<AnyLinkCommand>();
}
