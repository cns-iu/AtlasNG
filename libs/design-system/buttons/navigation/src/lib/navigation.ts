import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TrackClick } from '@atlasng/analytics';
import { AnyLink, AnyLinkCommand } from '@atlasng/common';

@Component({
  selector: 'ang-navigation',
  imports: [MatButtonModule, AnyLink, TrackClick],
  templateUrl: './navigation.html',
  styleUrl: './navigation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navigation {
  /** The link to navigate to */
  readonly link = input<AnyLinkCommand | null>(null);
}
