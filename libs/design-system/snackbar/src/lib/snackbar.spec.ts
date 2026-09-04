import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { screen } from '@testing-library/angular';
import { createSnackBarConfig, Snackbar } from './snackbar';

describe('SnackbarComponent', () => {
  let matSnackBar: MatSnackBar;
  const MESSAGE = 'Test message';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNoopAnimations()],
    });

    matSnackBar = TestBed.inject(MatSnackBar);
  });

  afterEach(() => {
    matSnackBar.dismiss();
  });

  it('should show the message and action on the same line by default', async () => {
    matSnackBar.openFromComponent(Snackbar, createSnackBarConfig(MESSAGE, { action: 'Action' }));

    const label = await screen.findByText(MESSAGE);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(label.closest('ang-snackbar')).not.toHaveClass('multiline');
  });

  it('should place the action and close button on their own line when multiline is true', async () => {
    matSnackBar.openFromComponent(
      Snackbar,
      createSnackBarConfig(MESSAGE, {
        action: 'Action',
        multiline: true,
        showClose: true,
      }),
    );

    const label = await screen.findByText(MESSAGE);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(label.closest('ang-snackbar')).toHaveClass('multiline');
  });

  it('should keep the snackbar on one line when multiline is true without actions', async () => {
    matSnackBar.openFromComponent(Snackbar, createSnackBarConfig(MESSAGE, { multiline: true }));

    const label = await screen.findByText(MESSAGE);
    expect(label.closest('ang-snackbar')).not.toHaveClass('multiline');
  });
});
