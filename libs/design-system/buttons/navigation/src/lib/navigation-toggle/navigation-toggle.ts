import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrackClick } from '@atlasng/analytics';

@Component({
  selector: 'ang-navigation-toggle',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './navigation-toggle.html',
  styleUrl: './navigation-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.selected]': 'selected()',
    '(click)': 'selected.set(!selected())',
  },
})
export class NavigationToggle {
  /** Whether the button is currently selected */
  readonly selected = model<boolean>(false);
}
