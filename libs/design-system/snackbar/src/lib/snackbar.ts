import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  multiline?: boolean;
  /** Flag to show/hide the close button */
  showClose?: boolean;
}

export interface SnackBarConfig extends MatSnackBarConfig<never>, Omit<SnackBarData, 'message'> {}

export function createSnackBarConfig(message: string, config: SnackBarConfig = {}): MatSnackBarConfig<SnackBarData> {
  const { action, multiline = false, showClose = false, panelClass = [] } = config;

  return {
    ...config,
    data: {
      message,
      action,
      multiline,
      showClose,
    },
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
  host: {
    class: 'ang-snackbar',
    '[class.multiline]': '(data.action || data.showClose) && data.multiline',
  },
})
export class Snackbar {
  /** Reference to the MatSnackbarRef */
  protected readonly snackbarRef = inject(MatSnackBarRef);

  /** Injection token for the snackbar data*/
  protected readonly data = inject<SnackBarData>(MAT_SNACK_BAR_DATA);
}

// function foo() {
//   const snackbar = inject(MatSnackBar);
//   snackbar.openFromComponent(Snackbar, createSnackBarConfig(''));
// }
