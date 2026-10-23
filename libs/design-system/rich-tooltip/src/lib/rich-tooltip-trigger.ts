import { FocusMonitor, InputModalityDetector, InteractivityChecker } from '@angular/cdk/a11y';
import { hasModifierKey } from '@angular/cdk/keycodes';
import {
  ConnectedPosition,
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  FlexibleConnectedPositionStrategy,
  OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import { RichTooltip } from './rich-tooltip';

/**
 * Reason a rich tooltip was closed. Decides whether focus returns to the trigger.
 * - `keyboard`: Escape was pressed
 * - `panel`: the panel requested closing, e.g. through a close button
 * - `trigger`: the trigger was clicked, its panel input changed, or {@link RichTooltipTrigger.close} was called
 * - `outside`: a pointer event happened outside the tooltip
 * - `detach`: the overlay was detached externally or the user navigated through history
 */
type CloseReason = 'keyboard' | 'panel' | 'trigger' | 'outside' | 'detach';

/** Minimum distance in pixels between the rich tooltip and the viewport edges. */
const VIEWPORT_MARGIN = 8;

/** Default positions of the rich tooltip relative to its trigger, in order of preference. */
const DEFAULT_POSITIONS: ConnectedPosition[] = [
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  { originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
  { originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

/**
 * Checks whether a keyboard event is a Tab or Shift+Tab press without other modifiers.
 *
 * @param event Keyboard event to check
 * @returns Whether the event moves focus sequentially
 */
function isTabEvent(event: KeyboardEvent): boolean {
  return event.key === 'Tab' && !hasModifierKey(event, 'altKey', 'ctrlKey', 'metaKey');
}

/**
 * Opens a {@link RichTooltip} panel in an overlay when the host element is clicked.
 *
 * The tooltip is persistent: it stays open until the trigger is clicked again, the user
 * clicks outside of it, presses Escape, navigates through history, or the panel closes itself.
 *
 * Focus follows the M3 rich tooltip guidance without trapping focus: it stays on the trigger when
 * the tooltip opens, Tab moves from the trigger to the first tabbable element in the panel and then
 * top to bottom through the panel, and Tab past the panel's last element continues after the trigger.
 * Shift+Tab from the panel's first element returns to the trigger. Focus returns to the trigger when
 * the tooltip is closed with Escape or from within the panel.
 *
 * @see https://m3.material.io/components/tooltips/accessibility
 */
@Directive({
  selector: '[angRichTooltipTriggerFor]',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-controls]': 'isOpen() ? panel().id : null',
    '(click)': 'toggle()',
    '(keydown)': 'handleTriggerKeydown($event)',
  },
  exportAs: 'angRichTooltipTrigger',
})
export class RichTooltipTrigger {
  /** Panel opened by this trigger. */
  readonly panel = input.required<RichTooltip>({ alias: 'angRichTooltipTriggerFor' });

  /** Positions of the panel relative to the trigger, in order of preference. */
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly positions = input<ConnectedPosition[]>(DEFAULT_POSITIONS, { alias: 'angRichTooltipPositions' });

  /** Emits when the panel opens. */
  readonly opened = output<void>();

  /** Emits when the panel closes. */
  readonly closed = output<void>();

  /** Whether the panel is currently open. */
  readonly isOpen = signal(false);

  /** Injector used to create the overlay. */
  readonly #injector = inject(Injector);

  /** Host element, used as the overlay origin. */
  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** View container in which the panel template is rendered. */
  readonly #viewContainerRef = inject(ViewContainerRef);

  /** Decides which elements of the panel can be reached with Tab. */
  readonly #interactivityChecker = inject(InteractivityChecker);

  /** Used to restore focus to the trigger with the right focus origin. */
  readonly #focusMonitor = inject(FocusMonitor);

  /** Tracks the most recent input modality, used as focus origin when restoring focus. */
  readonly #inputModalityDetector = inject(InputModalityDetector);

  /** Position strategy of the overlay. */
  #positionStrategy?: FlexibleConnectedPositionStrategy;

  /** Lazily created overlay. */
  #overlayRef?: OverlayRef;

  /** Sets up reacting to input changes and disposal of the overlay. */
  constructor() {
    effect(() => {
      this.panel();
      untracked(() => this.close());
    });

    effect(() => {
      const positions = this.positions();
      untracked(() => this.#updatePositions(positions));
    });

    inject(DestroyRef).onDestroy(() => {
      this.isOpen.set(false);
      this.#overlayRef?.dispose();
    });
  }

  /** Opens the panel. Does nothing if it is already open. */
  open(): void {
    if (this.isOpen()) {
      return;
    }

    this.#attachPanel();
    this.isOpen.set(true);
    this.opened.emit();
  }

  /** Closes the panel. Focus returns to the trigger if it was within the panel. Does nothing if it is already closed. */
  close(): void {
    this.#closeWithReason('trigger');
  }

  /** Toggles the panel. */
  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Moves focus from the trigger to the first tabbable element of the open panel on Tab.
   *
   * @param event Keydown event dispatched on the trigger
   */
  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (!isTabEvent(event) || event.shiftKey) {
      return;
    }

    const [el] = this.#getTabbableElements();
    if (el) {
      event.preventDefault();
      el.focus();
    }
  }

  /**
   * Moves focus out of the panel at its edges: Shift+Tab on the first tabbable element returns
   * to the trigger, and Tab on the last one continues with the element after the trigger.
   *
   * @param event Keydown event dispatched within the panel
   */
  #handlePanelKeydown(event: KeyboardEvent): void {
    if (!isTabEvent(event)) {
      return;
    }

    const tabbables = this.#getTabbableElements();
    const trigger = this.#elementRef.nativeElement;
    if (event.shiftKey && event.target === tabbables[0]) {
      event.preventDefault();
      trigger.focus();
    } else if (!event.shiftKey && event.target === tabbables.at(-1)) {
      const next = this.#getTabbableElementAfterTrigger();
      if (next) {
        event.preventDefault();
        next.focus();
      }
    }
  }

  /**
   * Applies new positions and repositions the panel if it is open.
   *
   * @param positions Positions in order of preference
   */
  #updatePositions(positions: ConnectedPosition[]): void {
    this.#positionStrategy?.withPositions(positions);
    if (this.#overlayRef?.hasAttached()) {
      this.#overlayRef.updatePosition();
    }
  }

  /**
   * Closes the panel, restores focus when appropriate and emits {@link RichTooltipTrigger.closed}.
   * Does nothing if the panel is already closed.
   *
   * @param reason Why the panel is being closed
   */
  #closeWithReason(reason: CloseReason): void {
    if (!this.isOpen()) {
      return;
    }

    if (this.#shouldRestoreFocus(reason)) {
      this.#restoreFocus(reason);
    }

    this.isOpen.set(false);
    this.#detachPanel();
    this.closed.emit();
  }

  /** Attaches the current panel to the overlay and closes when the panel requests it while attached. */
  #attachPanel(): void {
    const panel = this.panel();
    const overlayRef = this.#getOverlayRef();
    const viewRef = overlayRef.attach(new TemplatePortal(panel.templateRef(), this.#viewContainerRef));
    const closedSub = panel.closed.subscribe(() => this.#closeWithReason('panel'));

    viewRef.onDestroy(() => closedSub.unsubscribe());
  }

  /** Detaches the panel from the overlay, if attached. */
  #detachPanel(): void {
    this.#overlayRef?.detach();
  }

  /**
   * Gets the overlay, creating it and its position strategy on first use or after it was disposed.
   *
   * @returns The overlay of this trigger
   */
  #getOverlayRef(): OverlayRef {
    if (!this.#positionStrategy) {
      this.#positionStrategy = createFlexibleConnectedPositionStrategy(this.#injector, this.#elementRef)
        .withFlexibleDimensions(true)
        .withGrowAfterOpen(true)
        .withViewportMargin(VIEWPORT_MARGIN)
        .withPositions(this.positions());
    }

    if (!this.#overlayRef) {
      this.#overlayRef = createOverlayRef(this.#injector, {
        disposeOnNavigation: true,
        hasBackdrop: false,
        positionStrategy: this.#positionStrategy,
        scrollStrategy: createRepositionScrollStrategy(this.#injector),
      });

      this.#setupOverlayEvents(this.#overlayRef);
    }

    return this.#overlayRef;
  }

  /**
   * Closes the panel on outside clicks, Escape and external detaches, forgets the overlay once it is
   * disposed, and handles Tab within the panel.
   *
   * @param overlayRef Newly created overlay
   */
  #setupOverlayEvents(overlayRef: OverlayRef): void {
    overlayRef.outsidePointerEvents().subscribe((event) => {
      if (!this.#elementRef.nativeElement.contains(event.target as Node | null)) {
        this.#closeWithReason('outside');
      }
    });

    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && !hasModifierKey(event)) {
        event.preventDefault();
        this.#closeWithReason('keyboard');
      }
    });

    overlayRef.detachments().subscribe({
      next: () => this.#closeWithReason('detach'),
      complete: () => {
        this.#positionStrategy = undefined;
        this.#overlayRef = undefined;
      },
    });

    // Listen on the panel directly; keydownEvents() only reaches the topmost overlay, e.g. a matTooltip on the trigger
    overlayRef.overlayElement.addEventListener('keydown', (event) => this.#handlePanelKeydown(event));
  }

  /**
   * Decides whether closing should return focus to the trigger. Must be called while the panel is attached.
   *
   * @param reason Why the panel is being closed
   * @returns `true` for escape, or for panel and trigger closes while focus is within the panel
   */
  #shouldRestoreFocus(reason: CloseReason): boolean {
    if (reason === 'keyboard') {
      return true;
    } else if (reason !== 'panel' && reason !== 'trigger') {
      return false;
    } else if (!this.#overlayRef) {
      return false;
    }

    const overlayElement = this.#overlayRef.overlayElement;
    const activeElement = overlayElement.ownerDocument.activeElement;
    return activeElement !== null && overlayElement.contains(activeElement);
  }

  /**
   * Focuses the trigger with a focus origin matching how the panel was closed.
   *
   * @param reason Why the panel was closed
   */
  #restoreFocus(reason: CloseReason): void {
    const mostRecentModality = this.#inputModalityDetector.mostRecentModality ?? 'program';
    const focusOrigin = reason === 'keyboard' ? 'keyboard' : mostRecentModality;

    this.#focusMonitor.focusVia(this.#elementRef, focusOrigin);
  }

  /**
   * Gets the tabbable elements of the open panel in document order.
   *
   * @returns Tabbable elements, or an empty array when the panel is closed
   */
  #getTabbableElements(): HTMLElement[] {
    if (!this.#overlayRef?.hasAttached()) {
      return [];
    }

    const elements = this.#overlayRef.overlayElement.querySelectorAll<HTMLElement>('*');
    return Array.from(elements).filter((element) => this.#interactivityChecker.isTabbable(element));
  }

  /**
   * Gets the first tabbable element following the trigger in document order, skipping the trigger's
   * content and the panel. The panel is skipped because its overlay is rendered at the end of the document.
   *
   * @returns The element focus moves to after leaving the panel, if any
   */
  #getTabbableElementAfterTrigger(): HTMLElement | undefined {
    const trigger = this.#elementRef.nativeElement;
    const panel = this.#overlayRef?.overlayElement;
    const elements = trigger.ownerDocument.body.querySelectorAll<HTMLElement>('*');

    return Array.from(elements).find(
      (element) =>
        trigger.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING &&
        !trigger.contains(element) &&
        !panel?.contains(element) &&
        this.#interactivityChecker.isTabbable(element),
    );
  }
}
