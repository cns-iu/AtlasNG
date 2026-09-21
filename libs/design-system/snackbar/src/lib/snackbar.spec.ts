import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { screen } from '@testing-library/angular';
import { createSnackBarConfig, Snackbar } from './snackbar';

describe('createSnackBarConfig', () => {
  const MESSAGE = 'Test message';

  it('should create a snackbar config with default data and panel class', () => {
    expect(createSnackBarConfig(MESSAGE)).toEqual({
      data: {
        message: MESSAGE,
        action: undefined,
        actionRow: false,
        showClose: false,
      },
      duration: undefined,
      panelClass: ['ang-snackbar--panel'],
    });
  });

  it('should preserve custom configuration and panel classes', () => {
    expect(
      createSnackBarConfig(MESSAGE, {
        duration: 5000,
        horizontalPosition: 'end',
        panelClass: ['custom-panel'],
      }),
    ).toEqual({
      duration: 5000,
      horizontalPosition: 'end',
      panelClass: ['custom-panel', 'ang-snackbar--panel'],
      data: {
        message: MESSAGE,
        action: undefined,
        actionRow: false,
        showClose: false,
      },
    });
  });

  it.each([
    { action: 'Action', showClose: false },
    { action: undefined, showClose: true },
  ])('should disable the duration when an action or close button is present', ({ action, showClose }) => {
    expect(createSnackBarConfig(MESSAGE, { action, showClose, duration: 5000 }).duration).toBeUndefined();
  });
});

describe('SnackbarComponent', () => {
  let matSnackBar: MatSnackBar;
  const MESSAGE = 'Test message';

  beforeEach(() => {
    matSnackBar = TestBed.inject(MatSnackBar);
  });

  afterEach(() => {
    matSnackBar.dismiss();
  });

  it('should show the message and action on the same line by default', async () => {
    matSnackBar.openFromComponent(Snackbar, createSnackBarConfig(MESSAGE, { action: 'Action' }));

    const label = await screen.findByText(MESSAGE);
    expect(screen.getByRole('button', { name: 'Action', hidden: true })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { hidden: true })).toHaveLength(1);
    expect(label.closest('ang-snackbar')).not.toHaveClass('ang-snackbar--action-row');
  });

  it('should place the action and close button on their own row when actionRow is true', async () => {
    matSnackBar.openFromComponent(
      Snackbar,
      createSnackBarConfig(MESSAGE, {
        action: 'Action',
        actionRow: true,
        showClose: true,
      }),
    );

    const label = await screen.findByText(MESSAGE);
    expect(screen.getByRole('button', { name: 'Action', hidden: true })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { hidden: true })).toHaveLength(2);
    expect(label.closest('ang-snackbar')).toHaveClass('ang-snackbar--action-row');
  });

  it('should keep the snackbar on one row when actionRow is true without actions', async () => {
    matSnackBar.openFromComponent(Snackbar, createSnackBarConfig(MESSAGE, { actionRow: true }));

    const label = await screen.findByText(MESSAGE);
    expect(label.closest('ang-snackbar')).not.toHaveClass('action-row');
  });
});
