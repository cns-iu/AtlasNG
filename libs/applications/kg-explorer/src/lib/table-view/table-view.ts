import { booleanAttribute, Component, computed, effect, input, model, output, untracked } from '@angular/core';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { watchBreakpoint } from '@atlasng/cdk';
import type { SearchFieldDefinition, SearchFieldSpec } from '@atlasng/cdk/search';
import { MultiSelectFilter } from '@atlasng/design-system/multi-select-filter';
import type { SearchListOption } from '@atlasng/design-system/search-list';
import type { Row, SortPropDir, TableColumn } from '@atlasng/design-system/table';
import { FILE_FORMATS, type VersionControlFileFormat } from '@atlasng/design-system/version-control';
import { KgExplorerDownloadCellDefinition, type KgExplorerDownloadCellConfig } from '../download-cell/download-cell';
import type { KgExplorerDownloadRequest, KgExplorerFilter, KgExplorerFilterSelections } from '../models';
import { KgExplorerResultsTable } from '../results-table/results-table';

/** Selection of filters without an entry in the selections, shared so their chips are not re-rendered. */
const NO_SELECTION: SearchListOption[] = [];

/** Suggests the `title` of each row when it is a string. */
const TITLE_SUGGESTION_FIELD: SearchFieldDefinition<Row> = {
  name: 'title',
  get: (row) => {
    const title: unknown = row['title'];
    return typeof title === 'string' ? title : undefined;
  },
};

/**
 * White-label knowledge graph explorer in table view with a filter menu, a
 * searchable and sortable results table, and per-row downloads.
 *
 * The filter menu shows a multi-select filter for each of {@link filters}. The
 * explorer does not filter {@link items} itself: read {@link filterSelections}
 * and pass the matching rows. The menu is docked from the Angular Material
 * large breakpoint up and becomes a drawer controlled by {@link filtersOpen}
 * on smaller screens.
 * Projected content, such as a footer, is rendered at the end of the table and
 * scrolls with it.
 */
@Component({
  selector: 'ang-kg-explorer-table-view',
  imports: [KgExplorerResultsTable, MatSidenav, MatSidenavContainer, MatSidenavContent, MultiSelectFilter],
  templateUrl: './table-view.html',
  styleUrl: './table-view.scss',
  host: {
    class: 'ang-kg-explorer-table-view',
  },
})
export class KgExplorerTableView<TRow extends Row = Row> {
  /** Digital objects listed in the table. */
  readonly items = input<TRow[]>([]);

  /**
   * Table columns, built for example with the `kgExplorer*Column` helpers. Reuse
   * the array between changes so cell templates stay cached.
   */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** File formats offered by the per-row download menu. */
  readonly downloadFormats = input<readonly VersionControlFileFormat[]>(FILE_FORMATS);

  /** Filters displayed in the filter menu, in display order. */
  readonly filters = input<readonly KgExplorerFilter[]>([]);

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

  /** Fields to search. Defaults to every string, number, and array of strings or numbers of a row. */
  readonly searchFields = input<readonly SearchFieldSpec<TRow>[]>();

  /** Field whose values are suggested below the search field. Defaults to the row's `title`; `undefined` disables suggestions. */
  readonly searchSuggestionField = input<SearchFieldSpec<TRow> | undefined>(TITLE_SUGGESTION_FIELD);

  /** Disables the table search field. */
  readonly searchDisabled = input(false, { transform: booleanAttribute });

  /** Disables the "Viewing X of Y" results counter. */
  readonly resultsCounterDisabled = input(false, { transform: booleanAttribute });

  /** Disables the end-of-results indicator below the table. */
  readonly endOfResultsDisabled = input(false, { transform: booleanAttribute });

  /** Disables the download column. */
  readonly downloadDisabled = input(false, { transform: booleanAttribute });

  /** Emits when a user picks a download format for a row. */
  readonly download = output<KgExplorerDownloadRequest<TRow>>();

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

  /** Download column, recreated only when the download formats change. */
  protected readonly downloadColumn = computed<TableColumn<TRow>>(() => ({
    name: '',
    prop: '$$download',
    width: 40,
    flexGrow: 0,
    sortable: false,
    cellTemplate: KgExplorerDownloadCellDefinition,
    cellConfig: {
      formats: this.downloadFormats(),
      download: (item, format) => this.download.emit({ item, format }),
    } satisfies KgExplorerDownloadCellConfig<TRow>,
  }));

  /** Columns displayed by the table, including the optional download column. */
  protected readonly resolvedColumns = computed(() =>
    this.downloadDisabled() ? this.columns() : [this.downloadColumn(), ...this.columns()],
  );

  /**
   * Looks up the selected options of a filter.
   *
   * @param filter Filter to look up.
   * @returns The selected options, or an empty selection when the filter has none.
   */
  protected selectionOf(filter: KgExplorerFilter): SearchListOption[] {
    return this.filterSelections()[filter.id] ?? NO_SELECTION;
  }

  /**
   * Updates the selected options of a filter.
   *
   * @param filter Filter whose selection changed.
   * @param selected New selected options.
   */
  protected select(filter: KgExplorerFilter, selected: SearchListOption[]): void {
    this.filterSelections.update((selections) => ({ ...selections, [filter.id]: selected }));
  }

  /** Resets the filter selections. */
  protected clearAllFilters(): void {
    this.filterSelections.set({});
  }
}
