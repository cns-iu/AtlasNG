import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * No Results Component
 */
@Component({
  selector: 'ang-no-results',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './no-results.html',
  styleUrl: './no-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoResults {
  /** Output event that gets triggered on button click */
  readonly clearFilters = output<void>();
}
