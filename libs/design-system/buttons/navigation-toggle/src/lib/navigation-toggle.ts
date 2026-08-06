import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';

@Component({
  selector: 'ang-navigation-toggle',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './navigation-toggle.html',
  styleUrl: './navigation-toggle.scss',
  providers: [provideEventScope('navigation-toggle')],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ang-navigation-toggle--selected]': 'selected()',
    '(click)': 'selected.update(s => !s)',
  },
})
export class NavigationToggle {
  /** Whether the button is currently selected */
  readonly selected = model(false);
}
