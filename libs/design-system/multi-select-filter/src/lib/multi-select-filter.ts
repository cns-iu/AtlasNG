import { CdkTrapFocus, LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { DecimalPipe, formatNumber, NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  LOCALE_ID,
  model,
  numberAttribute,
  TemplateRef,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideEventScope, TrackClick } from '@atlasng/analytics';
import { watchBreakpoint } from '@atlasng/cdk';
import { IdGenerator } from '@atlasng/common';
import { RichTooltip, RichTooltipTrigger } from '@atlasng/design-system/rich-tooltip';
import { ScrollArea } from '@atlasng/design-system/scroll-area';
import { SearchList, SearchListOption } from '@atlasng/design-system/search-list';
import { MultiSelectFilterChipList } from './multi-select-filter-chip-list/multi-select-filter-chip-list';

/** Space above the search field inside the search list, in pixels. Matches the search list's top padding. */
const SEARCH_FIELD_INSET = 16;

/**
 * Multi-select filter: a label button that opens a {@link SearchList} flyout, a unique item
 * counter, a removable chip for every selected option, and an optional info button.
 *
 * From the `medium` breakpoint (960px), the search list opens in a panel beside the filter. The
 * panel is as tall as its options and only scrolls when they don't fit in the viewport. In short
 * viewports, it stops shrinking at 15rem.
 * On smaller screens, it opens in a full-screen dialog with a title, such as `Organ filters`, the
 * search field, the options, a tray with the selected options as a single row of removable chips
 * that scrolls sideways, and a Done button. Chips and the tray animate in and out unless the user
 * prefers reduced motion.
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
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MultiSelectFilterChipList,
    NgTemplateOutlet,
    RichTooltipTrigger,
    ScrollArea,
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
  readonly disableSearch = input(false, { transform: booleanAttribute });

  /** Whether the search list panel is open. */
  readonly expanded = model(false);

  /** Number of unique items in the filter. Defaults to the number of options. */
  readonly count = input<number>();

  /** Rich tooltip opened by the info button. The info button is only shown when this is set. */
  readonly infoPanel = input<RichTooltip>();

  /** Plain tooltip text of the info button. */
  readonly infoTooltip = input('Info');

  /** Accessible label of the info button. Defaults to `<label> info`. */
  readonly infoButtonLabel = input<string>();

  /** Plain tooltip text of the unique item counter. */
  readonly countTooltip = input('Number of unique items per filter category');

  /** Accessible label of the chip set with the selected options. */
  readonly selectedFiltersLabel = input('Active filters');

  /** Prefix of the accessible label of each chip's remove button, followed by the option label. */
  readonly removeFilterLabel = input('Remove');

  /**
   * Text announced to screen readers after the number of selected options whenever the user
   * changes the selection, for example `3 selected`.
   */
  readonly selectedCountText = input('selected');

  /** Text of the button that closes the full-screen dialog on small screens. */
  readonly doneLabel = input('Done');

  /** Title of the full-screen dialog on small screens. Defaults to `<label> filters`. */
  readonly dialogTitle = input<string>();

  /**
   * Horizontal distance, in pixels, from the end of the filter row to the search list panel.
   * Increase it to open the panel past the edge of a container with padding, such as a drawer.
   */
  readonly panelOffsetX = input(8, { transform: numberAttribute });

  /** Unique id of the search list panel, referenced by the label button's `aria-controls`. */
  protected readonly panelId = inject(IdGenerator).getId('ang-multi-select-filter--panel');

  /**
   * Positions of the search list panel. It opens to the right of the filter row with its search
   * field level with the row, and moves up when there is no room below. Where there is no room to
   * the right, it falls back to below the row, or above it.
   */
  protected readonly panelPositions = computed((): ConnectedPosition[] => {
    const offsetX = this.panelOffsetX();
    const offsetY = this.disableSearch() ? 0 : -SEARCH_FIELD_INSET;
    return [
      { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX, offsetY },
      { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'bottom', offsetX },
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    ];
  });

  /**
   * Whether the viewport is at least as wide as the `medium` breakpoint (960px). The search list
   * opens in a panel beside the filter when it is, and in a full-screen dialog when it isn't.
   */
  protected readonly wide = watchBreakpoint('medium');

  /** Content of the full-screen dialog. */
  private readonly dialogTemplate = viewChild<TemplateRef<unknown>>('dialog');

  /** Service that opens the full-screen dialog. */
  readonly #dialog = inject(MatDialog);

  /** Full-screen dialog while it is open. */
  #dialogRef?: MatDialogRef<unknown>;

  /** Announces selection changes to screen readers. */
  readonly #announcer = inject(LiveAnnouncer);

  /** Locale used to format the announced number of selected options. */
  readonly #locale = inject(LOCALE_ID);

  /** Number shown by the unique item counter. */
  protected readonly displayedCount = computed(() => this.count() ?? this.options().length);

  /** Accessible label of the info button. */
  protected readonly resolvedInfoButtonLabel = computed(() => this.infoButtonLabel() ?? `${this.label()} info`);

  /** Title of the full-screen dialog. */
  protected readonly resolvedDialogTitle = computed(() => this.dialogTitle() ?? `${this.label()} filters`);

  /**
   * Opens the full-screen dialog while the filter is expanded below the `medium` breakpoint, and
   * closes the search list when the viewport crosses the breakpoint.
   */
  constructor() {
    let wasWide = this.wide();
    effect(() => {
      const wide = this.wide();
      if (wide !== wasWide) {
        wasWide = wide;
        untracked(() => this.expanded.set(false));
      }

      const template = this.dialogTemplate();
      if (template && this.expanded() && !wide) {
        untracked(() => this.openDialog(template));
      } else {
        untracked(() => this.closeDialog());
      }
    });

    inject(DestroyRef).onDestroy(() => this.closeDialog());
  }

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
   * Updates the selection from the search list.
   * @param selected Options selected in the search list
   */
  protected updateSelected(selected: T[]): void {
    this.selected.set(selected);
    this.announceSelectedCount();
  }

  /**
   * Deselects an option.
   * @param option Option whose chip was removed
   */
  protected removeFilter(option: T): void {
    this.selected.update((current) => current.filter((item) => item !== option));
    this.announceSelectedCount();
  }

  /**
   * Opens the search list in a full-screen dialog. Closing the dialog with Done or Escape
   * collapses the filter, and the dialog returns focus to the label button.
   * @param template Content of the dialog
   */
  private openDialog(template: TemplateRef<unknown>): void {
    if (this.#dialogRef) {
      return;
    }

    const ref = this.#dialog.open(template, {
      panelClass: 'ang-multi-select-filter--dialog',
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
    });
    this.#dialogRef = ref;
    ref.beforeClosed().subscribe(() => {
      if (this.#dialogRef === ref) {
        this.#dialogRef = undefined;
        this.expanded.set(false);
      }
    });
  }

  /** Closes the full-screen dialog if it is open. */
  private closeDialog(): void {
    const ref = this.#dialogRef;
    this.#dialogRef = undefined;
    ref?.close();
  }

  /** Announces the number of selected options, for example `3 selected`. */
  private announceSelectedCount(): void {
    const count = formatNumber(this.selected().length, this.#locale);
    void this.#announcer.announce(`${count} ${this.selectedCountText()}`);
  }
}
