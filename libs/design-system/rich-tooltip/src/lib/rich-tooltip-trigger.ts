import { FocusMonitor, FocusOrigin, FocusTrap, FocusTrapFactory, InputModalityDetector } from '@angular/cdk/a11y';
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
import { Location } from '@angular/common';
import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
  OutputRefSubscription,
  output,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { RichTooltip } from './rich-tooltip';

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
 * Reason a rich tooltip was closed. Decides whether focus returns to the trigger.
 * - `keyboard`: Escape was pressed
 * - `panel`: the panel requested closing, e.g. through a close button
 * - `trigger`: the trigger was clicked or {@link RichTooltipTrigger.close} was called
 * - `outside`: a pointer event happened outside the tooltip
 * - `detach`: the overlay was detached externally or the user navigated through history
 */
type CloseReason = 'keyboard' | 'panel' | 'trigger' | 'outside' | 'detach';

/**
 * Opens a {@link RichTooltip} panel in an overlay when the host element is clicked.
 *
 * The tooltip is persistent: it stays open until the trigger is clicked again, the user
 * clicks outside of it, presses Escape, navigates through history, or the panel closes itself.
 * Focus moves into the panel when it has focusable content and returns to the trigger when
 * the tooltip is closed with the keyboard or from within the panel.
 */
@Directive({
  selector: '[angRichTooltipTriggerFor]',
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-controls]': 'isOpen() ? panel().id : null',
    '(click)': 'toggle()',
  },
  exportAs: 'angRichTooltipTrigger',
})
export class RichTooltipTrigger {
  /** Panel opened by this trigger. */
  readonly panel = input.required<RichTooltip>({ alias: 'angRichTooltipTriggerFor' });

  /** Positions of the panel relative to the trigger, in order of preference. Applied when the panel opens. */
  // Prefixed like the panel inputs of `matMenuTriggerFor`; the selector name is too specific to share.
  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly positions = input<ConnectedPosition[]>(DEFAULT_POSITIONS, { alias: 'angRichTooltipPositions' });

  /** Emits when the panel opens. */
  readonly opened = output<void>();

  /** Emits when the panel closes. */
  readonly closed = output<void>();

  /** Whether the panel is currently open. */
  readonly isOpen = signal(false);

  /** Injector used to create the overlay. */
  private readonly injector = inject(Injector);

  /** Host element, used as the overlay origin. */
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** View container in which the panel template is rendered. */
  private readonly viewContainerRef = inject(ViewContainerRef);

  /** Creates the focus trap that keeps keyboard focus within the open panel. */
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  /** Used to restore focus to the trigger with the right focus origin. */
  private readonly focusMonitor = inject(FocusMonitor);

  /** Tracks the most recent input modality, used as focus origin when restoring focus. */
  private readonly inputModalityDetector = inject(InputModalityDetector);

  /** Lazily created overlay. */
  private overlayRef?: OverlayRef;

  /** Position strategy of the overlay. */
  private positionStrategy?: FlexibleConnectedPositionStrategy;

  /** Focus trap of the currently open panel. */
  private focusTrap?: FocusTrap;

  /** Subscription to the open panel's `closed` output. */
  private panelClosedSubscription?: OutputRefSubscription;

  /** Sets up closing on history navigation and disposal of the overlay. */
  constructor() {
    const navigationSubscription = inject(Location).subscribe(() => this.closeWith('detach'));

    inject(DestroyRef).onDestroy(() => {
      navigationSubscription.unsubscribe();
      this.isOpen.set(false);
      this.panelClosedSubscription?.unsubscribe();
      this.focusTrap?.destroy();
      this.overlayRef?.dispose();
    });
  }

  /** Toggles the panel. */
  toggle(): void {
    if (this.isOpen()) {
      this.closeWith('trigger');
    } else {
      this.open();
    }
  }

  /** Opens the panel. Does nothing if it is already open. */
  open(): void {
    if (this.isOpen()) {
      return;
    }

    const panel = this.panel();
    const overlayRef = this.getOverlayRef();
    this.positionStrategy?.withPositions(this.positions());
    overlayRef.attach(new TemplatePortal(panel.templateRef(), this.viewContainerRef));

    this.panelClosedSubscription = panel.closed.subscribe(() => this.closeWith('panel'));
    const focusTrap = this.focusTrapFactory.create(overlayRef.overlayElement);
    this.focusTrap = focusTrap;
    afterNextRender(
      {
        write: () => {
          if (this.focusTrap === focusTrap) {
            focusTrap.focusInitialElement();
          }
        },
      },
      { injector: this.injector },
    );

    this.isOpen.set(true);
    this.opened.emit();
  }

  /** Closes the panel and returns focus to the trigger. Does nothing if it is already closed. */
  close(): void {
    this.closeWith('trigger');
  }

  /**
   * Closes the panel and cleans up the state of the open panel.
   *
   * @param reason Why the panel is being closed
   */
  private closeWith(reason: CloseReason): void {
    if (!this.isOpen()) {
      return;
    }

    const overlayElement = this.overlayRef?.overlayElement;
    const activeElement = overlayElement?.ownerDocument.activeElement;
    const focusWasInPanel = !!activeElement && overlayElement.contains(activeElement);

    this.isOpen.set(false);
    this.panelClosedSubscription?.unsubscribe();
    this.panelClosedSubscription = undefined;
    this.focusTrap?.destroy();
    this.focusTrap = undefined;
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
    }

    if (reason === 'keyboard' || ((reason === 'panel' || reason === 'trigger') && focusWasInPanel)) {
      this.focusMonitor.focusVia(this.elementRef, reason === 'keyboard' ? 'keyboard' : this.getFocusOrigin());
    }

    this.closed.emit();
  }

  /**
   * Gets the focus origin matching the most recent user input.
   *
   * @returns The focus origin to use when restoring focus
   */
  private getFocusOrigin(): FocusOrigin {
    return this.inputModalityDetector.mostRecentModality ?? 'program';
  }

  /**
   * Gets the overlay, creating it and its closing listeners on first use.
   *
   * @returns The overlay of this trigger
   */
  private getOverlayRef(): OverlayRef {
    if (this.overlayRef) {
      return this.overlayRef;
    }

    this.positionStrategy = createFlexibleConnectedPositionStrategy(this.injector, this.elementRef)
      .withFlexibleDimensions(true)
      .withGrowAfterOpen(true)
      .withViewportMargin(VIEWPORT_MARGIN);

    const overlayRef = createOverlayRef(this.injector, {
      hasBackdrop: false,
      positionStrategy: this.positionStrategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector),
    });

    overlayRef.outsidePointerEvents().subscribe((event) => {
      if (!this.elementRef.nativeElement.contains(event.target as Node | null)) {
        this.closeWith('outside');
      }
    });

    overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape' && !hasModifierKey(event)) {
        event.preventDefault();
        this.closeWith('keyboard');
      }
    });

    overlayRef.detachments().subscribe(() => this.closeWith('detach'));

    this.overlayRef = overlayRef;
    return overlayRef;
  }
}
