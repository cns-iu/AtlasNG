import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, numberAttribute } from '@angular/core';

@Component({
  selector: 'ang-results',
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrl: './results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
    /** Input for value */
  readonly value = input.required({ transform: numberAttribute });
  /** Input for total */
  readonly total = input.required({ transform: numberAttribute });
  /** Input for description */
  readonly description = input<string>('');
  /** Input for separator */
  readonly separator = input<string>('of');
  /** Input for item type */
  readonly itemType = input<string>('');
}
