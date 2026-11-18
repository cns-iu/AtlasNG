import { Directive, forwardRef, signal } from '@angular/core';
import { FormControl, FormsModule, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { provideAnalytics, withCustomBackend, withPermissionsConfig } from '@atlasng/analytics';
import { AnalyticsErrorCode } from '@atlasng/analytics/errors';
import { CoreEvents } from '@atlasng/analytics/events';
import { AnalyticsPermissions, provideInitialAnalyticsPermissions } from '@atlasng/analytics/permissions';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TrackControlChange } from './track-control-change';

describe('TrackControlChange', () => {
  afterEach(() => vi.useRealTimers());

  async function setup(template: string, imports: unknown[], componentProperties: Record<string, unknown> = {}) {
    const backend = { page: vi.fn(), track: vi.fn() };
    const result = await render(template, {
      imports: [TrackControlChange, ...(imports as never[])],
      providers: [
        provideAnalytics(
          { rootScope: 'root' },
          withCustomBackend(() => backend),
          withPermissionsConfig({ storage: false, changeEventName: false, storageEvents: false }),
        ),
        provideInitialAnalyticsPermissions(AnalyticsPermissions.FULL),
      ],
      componentProperties,
    });

    return { ...result, backend, user: userEvent.setup() };
  }

  it('should track user edits through ngModel without sending the value', async () => {
    const { backend, user } = await setup(
      `<input aria-label="Name" [(ngModel)]="name" [angTrackControlChange]="{ field: 'name' }" />`,
      [FormsModule],
      { name: '' },
    );

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'ab');

    expect(backend.track).toHaveBeenCalledTimes(2);
    expect(backend.track).toHaveBeenCalledWith(
      CoreEvents.Change,
      { field: 'name', path: 'root', trigger: 'valueChange' },
      undefined,
    );
  });

  it('should ignore model changes made from code', async () => {
    const name = signal('');
    const { backend, fixture } = await setup(
      `<input aria-label="Name" [ngModel]="name()" angTrackControlChange />`,
      [FormsModule],
      { name },
    );

    name.set('updated');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('updated');
    expect(backend.track).not.toHaveBeenCalled();
  });

  it('should track user edits through formControl but not setValue', async () => {
    const control = new FormControl('');
    const { backend, user } = await setup(
      `<input aria-label="Name" [formControl]="control" angTrackControlChange />`,
      [ReactiveFormsModule],
      { control },
    );

    control.setValue('from code');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'x');

    expect(backend.track).toHaveBeenCalledOnce();
  });

  it('should track selections in a Material select', async () => {
    const control = new FormControl('a');
    const { backend, user } = await setup(
      `<mat-form-field>
        <mat-select aria-label="Letter" [formControl]="control" angTrackControlChange>
          <mat-option value="a">A</mat-option>
          <mat-option value="b">B</mat-option>
        </mat-select>
      </mat-form-field>`,
      [ReactiveFormsModule, MatSelectModule],
      { control },
    );

    await user.click(screen.getByRole('combobox', { name: 'Letter' }));
    await user.click(await screen.findByRole('option', { name: 'B' }));

    expect(control.value).toBe('b');
    expect(backend.track).toHaveBeenCalledOnce();
    expect(backend.track).toHaveBeenCalledWith(CoreEvents.Change, { path: 'root', trigger: 'valueChange' }, undefined);
  });

  it('should debounce changes', async () => {
    vi.useFakeTimers();
    const { backend } = await setup(
      `<input aria-label="Name" ngModel angTrackControlChange angTrackControlChangeDebounce="300" />`,
      [FormsModule],
    );
    const input = screen.getByRole('textbox', { name: 'Name' });

    fireEvent.input(input, { target: { value: 'a' } });
    fireEvent.input(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(300);

    expect(backend.track).toHaveBeenCalledOnce();
  });

  it('should throw without a form control directive', async () => {
    await expect(setup(`<input aria-label="Name" angTrackControlChange />`, [])).rejects.toMatchObject({
      code: AnalyticsErrorCode.MissingFormControl,
    });
  });

  it('should throw for a form control directive without a value accessor', async () => {
    @Directive({
      selector: '[angCustomControl]',
      providers: [{ provide: NgControl, useExisting: forwardRef(() => CustomControl) }],
    })
    class CustomControl extends NgControl {
      override readonly control = new FormControl();

      constructor() {
        super();
      }

      override viewToModelUpdate(): void {
        // Not needed for the test
      }
    }

    await expect(
      setup(`<input aria-label="Name" angCustomControl angTrackControlChange />`, [CustomControl]),
    ).rejects.toMatchObject({ code: AnalyticsErrorCode.MissingValueAccessor });
  });
});
