import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TrackClick } from '@atlasng/analytics';
import { AnyLinkCommand } from '@atlasng/common';

@Component({
  selector: 'ang-navigation-category-toggle',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './navigation-category-toggle.html',
  styleUrl: './navigation-category-toggle.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationCategoryToggle {
  /** The link to navigate to (hides toggle icon if provided) */
  readonly link = input<AnyLinkCommand | null>(null);
  /** Whether to show the toggle icon */
  readonly toggled = model<boolean>(false);
}
