import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

/**
 * End of Results Component
 */
@Component({
  selector: 'ang-end-of-results',
  imports: [CommonModule],
  templateUrl: './end-of-results.component.html',
  styleUrl: './end-of-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndOfResultsComponent {
  /** Count of filtered results */
  readonly count = input.required({ transform: numberAttribute });

  /** Label text for results count */
  readonly label = input('Results:');

  /** Description text */
  readonly description = input('End of results');
}
