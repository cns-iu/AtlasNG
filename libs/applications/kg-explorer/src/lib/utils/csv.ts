import type { Row, TableColumn } from '@atlasng/design-system/table';
import Papa from 'papaparse';
import { kgExplorerNumberColumn, kgExplorerTextColumn } from './columns';

/** Table columns and rows parsed from a CSV file. */
export interface CsvTable {
  /** One column per header, in header order. */
  columns: TableColumn[];
  /** Rows keyed by header text. */
  rows: Row[];
}

/**
 * Parses CSV text into table columns and rows. The first line is the header. Columns with only numeric values become
 * number columns; the rest are text columns.
 *
 * @param text CSV text.
 * @returns The columns and rows.
 */
export function csvToTable(text: string): CsvTable {
  const { data: rows, meta } = Papa.parse<Row>(text, { header: true, dynamicTyping: true, skipEmptyLines: true });
  const headers = meta.fields ?? [];

  const columns = headers.map((header) => {
    const isNumeric = rows.every((row) => row[header] == null || typeof row[header] === 'number');
    return isNumeric ? kgExplorerNumberColumn(header, header) : kgExplorerTextColumn(header, header);
  });

  return { columns, rows };
}
