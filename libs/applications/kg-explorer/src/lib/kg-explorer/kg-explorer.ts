import { BreakpointObserver } from '@angular/cdk/layout';
import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import type { Row, SortPropDir, TableColumn } from '@atlasng/design-system/table';
import { FILE_FORMATS, type VersionControlFileFormat } from '@atlasng/design-system/version-control';
import { map } from 'rxjs';
import { DownloadCellDefinition, type DownloadCellConfig } from '../download-cell/download-cell';
import { KgExplorerFilterMenuPlaceholder } from '../filter-menu-placeholder/filter-menu-placeholder';
import type { KgExplorerDownload } from '../models';
import {
  defaultKgExplorerSearch,
  KG_EXPLORER_ROW_HEIGHT,
  KgExplorerResultsTable,
} from '../results-table/results-table';
import { KgExplorerTableEndSlot } from '../slots';

/** Media query matching the Angular Material large and extra-large breakpoints. */
export const KG_EXPLORER_SIDE_MENU_QUERY = '(min-width: 1280px)';

/**
 * Derives the autocomplete suggestion for a row from its `title` property.
 *
 * @param row Row to derive the suggestion from.
 * @returns The row title, or an empty string when the row has none.
 */
function defaultSearchLabel(row: Row): string {
  const title: unknown = row['title'];
  return typeof title === 'string' ? title : '';
}

/**
 * White-label knowledge graph explorer in table view with a filter menu, a
 * searchable and sortable results table, and per-row downloads.
 *
 * The filter menu is a placeholder until the filter form component is
 * available. It is docked from the Angular Material large breakpoint up and
 * becomes a drawer controlled by {@link filtersOpen} on smaller screens.
 * Project an `<ng-template angKgExplorerTableEnd>` to add content such as a
 * footer at the end of the table.
 */
@Component({
  selector: 'ang-kg-explorer',
  imports: [
    KgExplorerFilterMenuPlaceholder,
    KgExplorerResultsTable,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
  ],
  templateUrl: './kg-explorer.html',
  styleUrl: './kg-explorer.scss',
  host: {
    class: 'ang-kg-explorer',
  },
})
export class KgExplorer<TRow extends Row = Row> {
  /** Digital objects listed in the table. */
  readonly items = input<TRow[]>([]);

  /**
   * Table columns, built for example with the `kgExplorer*Column` helpers. Reuse
   * the array between changes so cell templates stay cached.
   */
  readonly columns = input.required<TableColumn<TRow>[]>();

  /** File formats offered by the per-row download menu. */
  readonly downloadFormats = input<readonly VersionControlFileFormat[]>(FILE_FORMATS);

  /** Height of each table row in pixels. */
  readonly rowHeight = input(KG_EXPLORER_ROW_HEIGHT);

  /** Current search term. */
  readonly search = model('');

  /** Currently applied column sorts. */
  readonly sorts = model<SortPropDir[]>([]);

  /**
   * Whether the filter menu is open. Set to `true` when the menu starts docked
   * or docks at the large breakpoint, and to `false` when it becomes a drawer again.
   */
  readonly filtersOpen = model(false);

  /** Decides whether a row matches the lowercase, trimmed search term. */
  readonly searchFn = input<(row: TRow, term: string) => boolean>(defaultKgExplorerSearch);

  /** Derives the autocomplete suggestion for a row. Defaults to the row's `title`. */
  readonly searchLabelFn = input<(row: TRow) => string>(defaultSearchLabel);

  /** Shows the table search field. */
  readonly showSearch = input(true, { transform: booleanAttribute });

  /** Shows the "Viewing X of Y" results counter. */
  readonly showResultsCounter = input(true, { transform: booleanAttribute });

  /** Shows the end-of-results indicator below the table. */
  readonly showEndOfResults = input(true, { transform: booleanAttribute });

  /** Adds a download column with a file format menu to each row. */
  readonly showDownload = input(true, { transform: booleanAttribute });

  /** Emits when a user picks a download format for a row. */
  readonly download = output<KgExplorerDownload<TRow>>();

  /** Emits when the user clears the results from the no-results indicator. */
  readonly clearFilters = output<void>();

  /** Projected template rendered at the end of the table. */
  protected readonly tableEndSlot = contentChild(KgExplorerTableEndSlot);

  /** Whether the filter menu is docked beside the table. */
  protected readonly docked = toSignal(
    inject(BreakpointObserver)
      .observe(KG_EXPLORER_SIDE_MENU_QUERY)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

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
    minWidth: 40,
    maxWidth: 40,
    flexGrow: 0,
    sortable: false,
    cellTemplate: DownloadCellDefinition,
    cellConfig: {
      formats: this.downloadFormats(),
      download: (item, format) => this.download.emit({ item, format }),
    } satisfies DownloadCellConfig<TRow>,
  }));

  /** Columns displayed by the table, including the optional download column. */
  protected readonly resolvedColumns = computed(() =>
    this.showDownload() ? [this.downloadColumn(), ...this.columns()] : this.columns(),
  );

  // /**
  //  * Keeps {@link filtersOpen} in sync with the drawer while it is not docked.
  //  *
  //  * @param opened Whether the drawer is now open.
  //  */
  // protected onOpenedChange(opened: boolean): void {
  //   if (!this.docked()) {
  //     this.filtersOpen.set(opened);
  //   }
  // }
}
