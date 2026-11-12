import type { SearchListOption } from '@atlasng/design-system/search-list';
import type { Row } from '@atlasng/design-system/table';
import type { KgExplorerFilter, KgExplorerFilterField, KgExplorerFilterSelections } from './models';

/**
 * Reads the filter values of a row. Strings and numbers are used as they are,
 * arrays contribute each of their strings and numbers, and other values are ignored.
 *
 * @param row Row to read.
 * @param field Row key or function providing the values.
 * @returns The values of the row as strings.
 */
function filterValuesOf<TRow extends Row>(row: TRow, field: KgExplorerFilterField<TRow>): string[] {
  const value: unknown = typeof field === 'function' ? field(row) : row[field];
  const values: readonly unknown[] = Array.isArray(value) ? value : [value];
  return values.filter((item) => typeof item === 'string' || typeof item === 'number').map(String);
}

/**
 * Creates a predicate for the rows that match the filter selections. A row
 * matches a filter when it has the label of any selected option (or when the
 * filter's `matches` function accepts it), and must match every filter with a
 * selection. Filters without `field` and `matches` are ignored.
 *
 * @param filters Filter definitions.
 * @param selections Selected options of each filter, keyed by filter id.
 * @returns The predicate, or `undefined` when no filter restricts the rows.
 */
export function createRowFilter<TRow extends Row>(
  filters: readonly KgExplorerFilter<TRow>[],
  selections: KgExplorerFilterSelections,
): ((row: TRow) => boolean) | undefined {
  const predicates: ((row: TRow) => boolean)[] = [];
  for (const { id, field, matches } of filters) {
    const selected = selections[id];
    if (!selected || selected.length === 0) {
      continue;
    }

    if (matches) {
      predicates.push((row) => matches(row, selected));
    } else if (field !== undefined) {
      const labels = new Set(selected.map((option) => option.label));
      predicates.push((row) => filterValuesOf(row, field).some((value) => labels.has(value)));
    }
  }

  return predicates.length > 0 ? (row) => predicates.every((predicate) => predicate(row)) : undefined;
}

/**
 * Derives the options of a filter from the values of the rows.
 *
 * @param items Rows to read.
 * @param field Row key or function providing the values.
 * @returns One option per distinct value in order of first appearance, with the number of rows that have the value.
 */
export function deriveFilterOptions<TRow extends Row>(
  items: readonly TRow[],
  field: KgExplorerFilterField<TRow>,
): SearchListOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const value of new Set(filterValuesOf(item, field))) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([label, count]) => ({ label, count }));
}
