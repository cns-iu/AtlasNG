import { booleanAttribute, ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { isThemePreference, ThemePreference } from './theme-preference';

/**
 * Presents light, dark, and device-controlled theme preferences as a single-select control.
 *
 * This component is intentionally presentational. Consumers are responsible for persisting
 * and applying changes, typically through {@link ThemePreferenceService}.
 */
@Component({
  selector: 'ang-theme-preference-selector',
  imports: [MatButtonToggleModule],
  templateUrl: './theme-preference-selector.html',
  styleUrl: './theme-preference-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-theme-preference-selector' },
})
export class ThemePreferenceSelector {
  /** Selected theme preference. */
  readonly preference = model<ThemePreference>('system');

  /** Whether users can change the selected preference. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Accessible name applied to the single-select toggle group. */
  readonly ariaLabel = input('Theme preference');

  /**
   * Updates the preference when Angular Material reports a valid selection.
   *
   * @param event Toggle-group change event.
   */
  protected handlePreferenceChange(event: MatButtonToggleChange): void {
    if (isThemePreference(event.value)) {
      this.preference.set(event.value);
    }
  }
}
