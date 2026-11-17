import { Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { provideEventScope, TrackClick } from '@atlasng/analytics';

/**
 * Disclosure button used in site navigation to show or hide a menu or panel.
 * Clicking toggles the two-way `expanded` model, which is exposed as `aria-expanded`.
 * Set `aria-controls` to the id of the menu or panel the button shows.
 * Clicks are tracked in the `navigation-toggle` analytics event scope.
 */
@Component({
  selector: 'ang-navigation-toggle',
  imports: [MatButtonModule, MatIconModule, TrackClick],
  templateUrl: './navigation-toggle.html',
  styleUrl: './navigation-toggle.scss',
  providers: [provideEventScope('navigation-toggle')],
  host: {
    class: 'ang-navigation-toggle',
    '[class.ang-navigation-toggle--expanded]': 'expanded()',
    '[attr.aria-label]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.aria-controls]': 'null',
    '(click)': 'expanded.update(e => !e)',
  },
})
export class NavigationToggle {
  /** Whether the menu or panel controlled by the button is shown */
  readonly expanded = model(false);

  /** Accessible name of the button. Defaults to the projected text. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  /** Space-separated ids of elements describing the button. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });

  /** Id of the menu or panel shown and hidden by the button. */
  readonly ariaControls = input<string | null>(null, { alias: 'aria-controls' });
}
