import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
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

export interface SnackBarData {
  /** Message in the snackbar */
  message: string;
  /** Action button text */
  action?: string;
  /** Whether to put snackbar actions on a separate bottom row */
  actionRow?: boolean;
  /** Flag to show/hide the close button */
  showClose?: boolean;
  /** Duration in milliseconds before the snackbar closes */
  duration?: number;
}

export interface SnackBarConfig extends MatSnackBarConfig<never>, Omit<SnackBarData, 'message'> {}

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
    panelClass: [...panelClass, 'ang-snackbar--panel'],
  };
}

/** Snackbar component */
@Component({
  selector: 'ang-snackbar',
  imports: [MatButton, MatIcon, MatIconButton, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel],
  templateUrl: './snackbar.html',
  styleUrl: './snackbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
