import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';
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
  /** Label text for results count */
  readonly label = input('Results:');

  /** Description text */
  readonly description = input('End of results');

  /** Count of filtered results */
  readonly count = input.required({ transform: numberAttribute });
}
