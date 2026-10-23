import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { DecimalPipe } from '@angular/common';
import { booleanAttribute, Component, computed, inject, input, model, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { IdGenerator } from '@atlasng/common';
import { RichTooltip, RichTooltipTrigger } from '@atlasng/design-system/rich-tooltip';
import { SearchList, SearchListOption } from '@atlasng/design-system/search-list';

/** Positions of the search list panel: below the label button, or above it when there is no room. */
const PANEL_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * Multi-select filter: a label button that opens a {@link SearchList} flyout, a unique item
 * counter, a removable chip for every selected option, and an optional info button.
 *
 * Takes the same options as the search list. Selections are matched by option object identity,
 * and removing a chip deselects its option in the search list.
 */
@Component({
  selector: 'ang-multi-select-filter',
  imports: [
    CdkTrapFocus,
    CdkConnectedOverlay,
    CdkOverlayOrigin,
    DecimalPipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    RichTooltipTrigger,
    SearchList,
    TrackClick,
  ],
  templateUrl: './multi-select-filter.html',
  styleUrl: './multi-select-filter.scss',
  providers: [provideEventScope('multi-select-filter')],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ang-multi-select-filter' },
})
export class MultiSelectFilter<T extends SearchListOption> {
  /** Name of the filter, shown on the button that opens the search list. */
  readonly label = input.required<string>();

  /** Options of the search list. */
  readonly options = input.required<T[]>();

  /** Selected options, shown as removable chips. */
  readonly selected = model<T[]>([]);

  /** Current search term of the search list. */
  readonly search = model('');

  /** Whether the search field of the search list is hidden, e.g. for categories with few options. */
  readonly searchDisabled = input(false, { transform: booleanAttribute });

  /** Whether the search list panel is open. */
  readonly expanded = model(false);

  /** Number of unique items in the filter. Defaults to the number of options. */
  readonly count = input<number>();

  /** Rich tooltip opened by the info button. The info button is only shown when this is set. */
  readonly infoTooltip = input<RichTooltip>();

  /** Plain tooltip text of the info button. */
  readonly infoTooltipText = input('Info');

  /** Accessible label of the info button. Defaults to `<label> info`. */
  readonly infoLabel = input<string>();

  /** Plain tooltip text of the unique item counter. */
  readonly countTooltipText = input('Number of unique items per filter category');

  /** Accessible label of the chip set with the selected options. */
  readonly selectedLabel = input('Active filters');

  /** Prefix of the accessible label of each chip's remove button, followed by the option label. */
  readonly removeLabel = input('Remove');

  /** Unique id of the search list panel, referenced by the label button's `aria-controls`. */
  protected readonly panelId = inject(IdGenerator).getId('ang-multi-select-filter--panel');

  /** Positions of the search list panel. */
  protected readonly panelPositions = PANEL_POSITIONS;

  /** Number shown by the unique item counter. */
  protected readonly displayedCount = computed(() => this.count() ?? this.options().length);

  /** Accessible label of the info button. */
  protected readonly resolvedInfoLabel = computed(() => this.infoLabel() ?? `${this.label()} info`);

  /** Toggles the search list panel. */
  protected toggle(): void {
    this.expanded.update((expanded) => !expanded);
  }

  /** Closes the search list panel. */
  protected close(): void {
    this.expanded.set(false);
  }

  /**
   * Closes the search list panel when Escape is pressed within it.
   * @param event Keydown event dispatched within the panel
   */
  protected handlePanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  /**
   * Deselects an option.
   * @param option Option whose chip was removed
   */
  protected removeFilter(option: T): void {
    this.selected.update((current) => current.filter((item) => item !== option));
  }
}
