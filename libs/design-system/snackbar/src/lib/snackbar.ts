import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBarAction,
  MatSnackBarActions,
  MatSnackBarConfig,
  MatSnackBarLabel,
  MatSnackBarRef,
} from '@angular/material/snack-bar';

/** Data passed to the {@link Snackbar} component */
export interface SnackBarData {
  /** Message in the snackbar */
  message: string;
  /** Action button text */
  action?: string;
  /** Whether to put snackbar actions on a separate bottom row */
  actionRow?: boolean;
  /** Flag to show/hide the close button */
  showClose?: boolean;
  /**
   * Duration in milliseconds before the snackbar closes
   * @deprecated Never read. Set `duration` on the {@link SnackBarConfig} passed to {@link createSnackBarConfig} instead.
   */
  duration?: number;
}

/** Snackbar configuration accepted by {@link createSnackBarConfig} */
export interface SnackBarConfig extends MatSnackBarConfig<never>, Omit<SnackBarData, 'message' | 'duration'> {}

/**
 * Creates a `MatSnackBar` configuration for opening the {@link Snackbar} component.
 * Snackbars with an action or close button stay open until dismissed.
 *
 * @param message Message to show in the snackbar
 * @param config Additional snackbar configuration
 * @returns Configuration to pass to `MatSnackBar.openFromComponent`
 */
export function createSnackBarConfig(message: string, config: SnackBarConfig = {}): MatSnackBarConfig<SnackBarData> {
  const { action, actionRow = false, showClose = false, panelClass = [] } = config;

  const duration = action || showClose ? undefined : config.duration;

  return {
    ...config,
    data: {
      message,
      action,
      actionRow,
      showClose,
    },
    duration,
    panelClass: [...(typeof panelClass === 'string' ? [panelClass] : panelClass), 'ang-snackbar--panel'],
  };
}

/** Snackbar component */
@Component({
  selector: 'ang-snackbar',
  imports: [MatButton, MatIcon, MatIconButton, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel],
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'ang-snackbar',
    '[class.ang-snackbar--action-row]': '(data.action || data.showClose) && data.actionRow',
  },
})
export class Snackbar {
  /** Reference to the MatSnackbarRef */
  protected readonly snackbarRef = inject(MatSnackBarRef);

  /** Injection token for the snackbar data*/
  protected readonly data = inject<SnackBarData>(MAT_SNACK_BAR_DATA);
}
