import { Component, computed, effect, input, model, output, untracked } from '@angular/core';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { watchBreakpoint } from '@atlasng/cdk';
import { MultiSelectFilter } from '@atlasng/design-system/multi-select-filter';
import type { SearchListOption } from '@atlasng/design-system/search-list';
import type { Row, SortPropDir, TableColumn } from '@atlasng/design-system/table';
import type { VersionControlFileFormat } from '@atlasng/design-system/version-control';
import { KG_EXPLORER_TABLE_VIEW_CONFIG, type KgExplorerTableViewConfig } from '../config';
import { KgExplorerDownloadCellDefinition, type KgExplorerDownloadCellConfig } from '../download-cell/download-cell';
import { createRowFilter, deriveFilterOptions } from '../utils/filtering';
import type { KgExplorerDownloadRequest, KgExplorerFilter, KgExplorerFilterSelections } from '../models';
import { KgExplorerTablePanel } from '../table-panel/table-panel';

/** Selection of filters without an entry in the selections, shared so their chips are not re-rendered. */
const NO_SELECTION: SearchListOption[] = [];

/** A filter with its options resolved. */
type ResolvedFilter<TRow extends Row> = KgExplorerFilter<TRow> & { options: SearchListOption[] };

/**
 * Copies the defined properties of an object, so that `undefined` values do not mask defaults when spread.
 *
 * @param value Object to copy.
 * @returns The properties of the object whose value is not `undefined`.
 */
function pickDefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Partial<T>;
}

/**
 * White-label knowledge graph explorer in table view with a filter menu, a
 * searchable and sortable results table, and per-row downloads.
 *
 * The filter menu shows a multi-select filter for each of {@link filters}.
 * Filters with a `field` or `matches` narrow the rows after they are searched,
 * without rebuilding the search index; for other filters, read
 * {@link filterSelections} and pass the matching {@link items}. The menu is
 * docked from the Angular Material large breakpoint up and becomes a drawer
 * controlled by {@link filtersOpen} on smaller screens.
 * Projected content, such as a footer, is rendered at the end of the table and
 * scrolls with it.
 *
 * Search, download, and visibility options are set through {@link config},
 * which is merged over the defaults provided with `provideKgExplorerTableView`.
 */
@Component({
  selector: 'ang-kg-explorer-table-view',
  imports: [KgExplorerTablePanel, MatSidenav, MatSidenavContainer, MatSidenavContent, MultiSelectFilter],
  templateUrl: './table-view.html',
  styleUrl: './table-view.scss',
  host: {
    class: 'ang-kg-explorer-table-view',
  },
})
export class KgExplorerTableView<
  TRow extends Row = Row,
  TFormat extends VersionControlFileFormat = VersionControlFileFormat,
> {
  /** Digital objects listed in the table. */
  readonly items = input<TRow[]>([]);

  /**
   * Table columns, built for example with the `kgExplorer*Column` helpers. Reuse
   * the array between changes so cell templates stay cached.
   */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** Filters displayed in the filter menu, in display order. */
  readonly filters = input<readonly KgExplorerFilter<TRow>[]>([]);

  /** Selected options of each filter, keyed by filter id. Reset when the user clears the results. */
  readonly filterSelections = model<KgExplorerFilterSelections>({});

  /** Current search term. */
  readonly search = model('');

  /** Currently applied column sorts. */
  readonly sorts = model<SortPropDir[]>([]);

  /**
   * Whether the filter menu is open. Set to `true` when the menu starts docked
   * or docks at the large breakpoint, and to `false` when it becomes a drawer again.
   */
  readonly filtersOpen = model(false);

  /**
   * Search, download, and visibility options. Omitted options use the values
   * provided with `provideKgExplorerTableView` and then the built-in defaults.
   */
  readonly config = input<KgExplorerTableViewConfig<TRow, TFormat>>({});

  /** Emits when a user picks a download format for a row. */
  readonly download = output<KgExplorerDownloadRequest<TRow, TFormat>>();

  /** Defaults provided with `provideKgExplorerTableView`, with the built-in defaults applied. */
  private readonly defaults = KG_EXPLORER_TABLE_VIEW_CONFIG.inject() as KgExplorerTableViewConfig<TRow, TFormat>;

  /** The {@link config} input merged over the provided defaults. */
  protected readonly resolvedConfig = computed((): KgExplorerTableViewConfig<TRow, TFormat> => ({
    ...this.defaults,
    ...pickDefined(this.config()),
  }));

  /** Filters with the options of their search lists, derived from the items where a filter has none. */
  protected readonly resolvedFilters = computed((): ResolvedFilter<TRow>[] => {
    const items = this.items();
    return this.filters().map((filter) => ({
      ...filter,
      options: filter.options ?? (filter.field === undefined ? [] : deriveFilterOptions(items, filter.field)),
    }));
  });

  /**
   * Selected options of each filter, with selections replaced by the listed option of the same label so that
   * selections created elsewhere, or before the options were derived again, stay checked in the list.
   */
  private readonly resolvedSelections = computed(() => {
    const selections = this.filterSelections();
    const resolved: Record<string, SearchListOption[]> = {};
    for (const { id, options } of this.resolvedFilters()) {
      const selected = selections[id];
      if (selected && selected.length > 0) {
        const byLabel = new Map(options.map((option) => [option.label, option]));
        resolved[id] = selected.map((option) => byLabel.get(option.label) ?? option);
      }
    }
    return resolved;
  });

  /** Predicate for the rows matching the filter selections; `undefined` when no filter restricts the rows. */
  protected readonly rowFilter = computed(() => createRowFilter(this.filters(), this.filterSelections()));

  /** File formats of the download column, or `undefined` when there is no download column. */
  private readonly downloadFormats = computed(() => this.resolvedConfig().downloadFormats);

  /** Whether the filter menu is docked beside the table. */
  protected readonly docked = watchBreakpoint('large');

  /** Opens the filter menu when it is or becomes docked and closes the drawer when it undocks. */
  constructor() {
    let previous: boolean | undefined;
    effect(() => {
      const docked = this.docked();
      // Open a menu that starts docked; afterwards follow every docked change.
      const changed = previous === undefined ? docked : previous !== docked;
      if (changed) {
        untracked(() => this.filtersOpen.set(docked));
      }
      previous = docked;
    });
  }

  /** Download column, recreated only when the download formats change; `undefined` without download formats. */
  private readonly downloadColumn = computed((): TableColumn<TRow> | undefined => {
    const formats = this.downloadFormats();
    if (formats === undefined) {
      return undefined;
    }

    return {
      name: '',
      prop: '$$download',
      width: 40,
      flexGrow: 0,
      sortable: false,
      cellTemplate: KgExplorerDownloadCellDefinition,
      cellConfig: {
        formats,
        download: (item, format) => this.download.emit({ item, format }),
      } satisfies KgExplorerDownloadCellConfig<TRow, TFormat>,
    };
  });

  /** Columns displayed by the table, including the optional download column. */
  protected readonly resolvedColumns = computed(() => {
    const downloadColumn = this.downloadColumn();
    return downloadColumn ? [downloadColumn, ...this.columns()] : this.columns();
  });

  /**
   * Looks up the selected options of a filter.
   *
   * @param filter Filter to look up.
   * @returns The selected options, or an empty selection when the filter has none.
   */
  protected selectionFor(filter: KgExplorerFilter<TRow>): SearchListOption[] {
    return this.resolvedSelections()[filter.id] ?? NO_SELECTION;
  }

  /**
   * Updates the selected options of a filter.
   *
   * @param filter Filter whose selection changed.
   * @param selected New selected options.
   */
  protected select(filter: KgExplorerFilter<TRow>, selected: SearchListOption[]): void {
    this.filterSelections.update((selections) => ({ ...selections, [filter.id]: selected }));
  }

  /** Resets the filter selections. */
  protected clearAllFilters(): void {
    this.filterSelections.set({});
  }
}
