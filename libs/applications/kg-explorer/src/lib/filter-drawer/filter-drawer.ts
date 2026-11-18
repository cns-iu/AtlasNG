import { Component, computed, input, model, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatOption, MatSelect } from '@angular/material/select';
import { type BreadcrumbItem, Breadcrumbs } from '@atlasng/design-system/buttons/breadcrumbs';
import { MultiSelectFilter } from '@atlasng/design-system/multi-select-filter';
import type { SearchListOption } from '@atlasng/design-system/search-list';
import type { Row } from '@atlasng/design-system/table';
import type {
  KgExplorerFilterSelections,
  KgExplorerResolvedFilter,
  KgExplorerViewOption,
  KgExplorerViewSetting,
  KgExplorerViewSettingValues,
} from '../models';
import type { KgExplorerFilterDrawerConfig } from '../table-view/config';

/** Selection of filters without an entry in the selections, shared so their chips are not re-rendered. */
const NO_SELECTION: SearchListOption[] = [];

/** Change of the selected options of one filter. */
export interface KgExplorerFilterSelectionChange<TRow extends Row = Row> {
  /** Filter whose selection changed. */
  filter: KgExplorerResolvedFilter<TRow>;
  /** New selected options of the filter. */
  selected: SearchListOption[];
}

/**
 * Filter drawer of the knowledge graph explorer table view.
 *
 * Shows, from top to bottom and each only when it has content: breadcrumbs, a
 * heading with supporting text, a "Customize view" section with a button
 * toggle of {@link viewOptions} and a select for each of {@link viewSettings},
 * and a "Filters" section with a multi-select filter for each of
 * {@link filters}. The view customizations are only reported through the
 * models and outputs; the consumer applies them.
 */
@Component({
  selector: 'ang-kg-explorer-filter-drawer',
  imports: [
    Breadcrumbs,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatFormField,
    MatIcon,
    MatLabel,
    MatOption,
    MatPrefix,
    MatSelect,
    MultiSelectFilter,
  ],
  templateUrl: './filter-drawer.html',
  styleUrl: './filter-drawer.scss',
  host: {
    class: 'ang-kg-explorer-filter-drawer',
  },
})
export class KgExplorerFilterDrawer<TRow extends Row = Row> {
  /** Breadcrumb trail shown at the top of the drawer. Hidden when empty. */
  readonly breadcrumbs = input<BreadcrumbItem[]>([]);

  /** Heading shown below the breadcrumbs. */
  readonly heading = input<string>();

  /** Supporting text shown below the heading. */
  readonly description = input<string>();

  /** Options of the view button toggle. Hidden when empty. */
  readonly viewOptions = input<KgExplorerViewOption[]>([]);

  /** Value of the picked view option. */
  readonly view = model<string>();

  /** Selects shown below the view button toggle, such as "View as", "Sort by" or "Group by". */
  readonly viewSettings = input<KgExplorerViewSetting[]>([]);

  /** Picked value of each view setting, keyed by setting id. */
  readonly viewSettingValues = model<KgExplorerViewSettingValues>({});

  /** Filters with their resolved options, in display order. */
  readonly filters = input<KgExplorerResolvedFilter<TRow>[]>([]);

  /** Selected options of each filter, keyed by filter id. */
  readonly filterSelections = input<KgExplorerFilterSelections>({});

  /** Resolved filter drawer options, used for the drawer's labels. */
  readonly config = input<KgExplorerFilterDrawerConfig>({});

  /** Emits when the user changes the selected options of a filter. */
  readonly selectionChange = output<KgExplorerFilterSelectionChange<TRow>>();

  /** Emits when the user clicks the clear filters button. */
  readonly clearClick = output<void>();

  /** Emits when the user clicks the reset button of the view customizations, shown after the user changes them. */
  readonly resetClick = output<void>();

  /** Whether the "Customize view" section is shown. */
  protected readonly hasCustomizations = computed(
    () => this.viewOptions().length > 0 || this.viewSettings().length > 0,
  );

  /**
   * Whether the user changed the view option or a view setting since the drawer was created or last reset; the
   * reset button is only shown then.
   */
  protected readonly viewChanged = signal(false);

  /** Whether any filter has a selected option; the clear filters button is only shown then. */
  protected readonly hasSelection = computed(() =>
    Object.values(this.filterSelections()).some((selected) => selected.length > 0),
  );

  /**
   * Looks up the selected options of a filter.
   *
   * @param filter Filter to look up.
   * @returns The selected options, or an empty selection when the filter has none.
   */
  protected selectionFor(filter: KgExplorerResolvedFilter<TRow>): SearchListOption[] {
    return this.filterSelections()[filter.id] ?? NO_SELECTION;
  }

  /**
   * Stores the picked value of a view setting.
   *
   * @param setting Setting whose value changed.
   * @param value Picked value.
   */
  protected setViewSetting(setting: KgExplorerViewSetting, value: string | undefined): void {
    this.viewSettingValues.update((values) => ({ ...values, [setting.id]: value }));
    this.viewChanged.set(true);
  }

  /**
   * Stores the picked view option.
   *
   * @param value Value of the picked view option.
   */
  protected setView(value: string | undefined): void {
    this.view.set(value);
    this.viewChanged.set(true);
  }

  /** Hides the reset button and asks the consumer to reset the view customizations. */
  protected resetView(): void {
    this.viewChanged.set(false);
    this.resetClick.emit();
  }
}
