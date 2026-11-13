import { Component, input, ViewEncapsulation } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

/** Renders a group of non-interactive chips, for example tags, for a `MetadataChips` content node. */
@Component({
  selector: 'ang-kg-explorer-metadata-chips',
  imports: [MatChipsModule],
  templateUrl: './metadata-chips.html',
  styleUrl: './metadata-chips.scss',
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ang-kg-explorer-metadata-chips' },
})
export class KgExplorerMetadataChips {
  /** Chip labels, in display order. */
  readonly labels = input.required<readonly string[]>();
}
