import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

/**
 * End of Results Component
 */
@Component({
  selector: 'ang-end-of-results',
  imports: [CommonModule, MatDividerModule],
  templateUrl: './end-of-results.html',
  styleUrl: './end-of-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndOfResults {
  /** Label text placed before the results count */
  readonly label = input('Results:');

  /** Description placed after the results count in it's own text box */
  readonly description = input('End of results');

  /** Number of results */
  readonly count = input.required<number>();
}
