import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Marks the end of a list of results with a divider, the formatted results count,
 * and a closing message.
 */
@Component({
  selector: 'ang-end-of-results-indicator',
  imports: [DecimalPipe, MatDividerModule],
  templateUrl: './end-of-results-indicator.html',
  styleUrl: './end-of-results-indicator.scss',
  host: { class: 'ang-end-of-results-indicator' },
})
export class EndOfResultsIndicator {
  /** Label text placed before the results count */
  readonly label = input('Results:');

  /** Description placed after the results count in its own text box */
  readonly description = input('End of results');

  /** Number of results */
  readonly count = input.required<number>();
}
