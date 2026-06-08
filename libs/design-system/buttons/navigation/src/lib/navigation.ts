import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';

@Component({
  selector: 'ang-navigation-button',
  imports: [MatButtonModule, AnyLink, TrackClick],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
  providers: [provideEventScope('navigation-button')],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationButton {
  /** The link to navigate to */
  readonly link = input<AnyLinkCommand>();
}
