import { Component, computed, input, resource } from '@angular/core';
import { Table } from '@atlasng/design-system/table';
import { csvToTable } from '../utils/csv';

/**
 * Displays a CSV file in a design-system table for a `MetadataTable` content node.
 */
@Component({
  selector: 'ang-kg-explorer-metadata-table',
  imports: [Table],
  templateUrl: './metadata-table.html',
  host: { class: 'ang-kg-explorer-metadata-table' },
})
export class KgExplorerMetadataTable {
  /** URL of the CSV file. */
  readonly url = input.required<string>();

  /** Contents of the CSV file. */
  protected readonly csv = resource({
    params: () => this.url(),
    loader: async ({ params: url }) => {
      const response = await fetch(url);
      return response.text();
    },
  });

  /** Parsed columns and rows, or `undefined` until the file loads. */
  protected readonly table = computed(() => (this.csv.hasValue() ? csvToTable(this.csv.value()) : undefined));
}
