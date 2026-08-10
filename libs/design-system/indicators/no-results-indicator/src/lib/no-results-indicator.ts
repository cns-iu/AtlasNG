import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { provideEventScope, TrackClick } from '@atlasng/analytics';

/**
 * Empty-state indicator shown when a results list has no matches.
 *
 * The component renders a short message and a clear action that
 * consumers can wire to reset search or filter state.
 */
@Component({
  selector: 'ang-no-results-indicator',
  imports: [MatButtonModule, TrackClick],
  templateUrl: './no-results-indicator.html',
  styleUrl: './no-results-indicator.scss',
  providers: [provideEventScope('no-results-indicator')],
  host: { class: 'ang-no-results-indicator' },
})
export class NoResultsIndicator {
  /** Message shown above the action button. */
  readonly description = input('No results. Adjust filters or search again.');

  /** Button label used for the clear action. */
  readonly label = input('Clear filters');

  /** Emitted when the action button is clicked. */
  readonly clear = output<void>();
}
