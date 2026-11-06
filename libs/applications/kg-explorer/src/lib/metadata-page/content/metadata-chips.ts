import { Component, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

/** Renders a group of non-interactive chips, for example tags, for a `MetadataChips` content node. */
@Component({
  selector: 'ang-metadata-chips',
  imports: [MatChipsModule],
  templateUrl: './metadata-chips.html',
  styleUrl: './metadata-chips.scss',
  host: { class: 'ang-metadata-chips' },
})
export class MetadataChips {
  /** Chip labels, in display order. */
  readonly labels = input.required<readonly string[]>();
}
