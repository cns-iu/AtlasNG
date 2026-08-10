import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

/**
 * End of Results Indicator Component
 */
@Component({
  selector: 'ang-end-of-results-indicator',
  imports: [CommonModule, MatDividerModule],
  templateUrl: './end-of-results-indicator.html',
  styleUrl: './end-of-results-indicator.scss',
  host: { class: 'ang-end-of-results-indicator' },
})
export class EndOfResultsIndicator {
  /** Label text placed before the results count */
  readonly label = input('Results:');

  /** Description placed after the results count in it's own text box */
  readonly description = input('End of results');

  /** Number of results */
  readonly count = input.required<number>();
}
