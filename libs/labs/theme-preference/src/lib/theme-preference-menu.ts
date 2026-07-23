import { booleanAttribute, ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MenuPositionX, MenuPositionY } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemePreference } from './theme-preference';

/** Display information for a theme preference menu item. */
interface ThemePreferenceMenuOption {
  /** Value emitted when the option is selected. */
  readonly value: ThemePreference;

  /** Public-facing option label. */
  readonly label: string;

  /** Material icon displayed before the option label. */
  readonly icon: string;
}

/** Theme preference options in their display order. */
const THEME_PREFERENCE_MENU_OPTIONS: readonly ThemePreferenceMenuOption[] = [
  { value: 'light', label: 'Light mode', icon: 'light_mode' },
  { value: 'dark', label: 'Dark mode', icon: 'dark_mode' },
  { value: 'system', label: 'Device settings', icon: 'devices' },
];

/**
 * Compact icon-button menu for choosing a light, dark, or device-controlled theme preference.
 *
 * The menu defaults to opening below and before its trigger, which suits actions placed at the
 * right edge of application headers. Angular Material can flip this position to remain onscreen.
 */
@Component({
  selector: 'ang-theme-preference-menu',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './theme-preference-menu.html',
  styleUrl: './theme-preference-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ang-theme-preference-menu' },
})
export class ThemePreferenceMenu {
  /** Selected theme preference. */
  readonly preference = model<ThemePreference>('system');

  /** Whether the menu trigger is disabled. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Accessible name applied to the icon-button trigger. */
  readonly ariaLabel = input('Choose theme preference');

  /** Tooltip displayed for the icon-button trigger. */
  readonly tooltip = input('Theme settings');

  /** Horizontal menu position relative to the trigger. */
  readonly xPosition = input<MenuPositionX>('before');

  /** Vertical menu position relative to the trigger. */
  readonly yPosition = input<MenuPositionY>('below');

  /** Whether the menu panel overlaps its trigger. */
  readonly overlapTrigger = input(false, { transform: booleanAttribute });

  /** Ordered menu options rendered by the template. */
  protected readonly options = THEME_PREFERENCE_MENU_OPTIONS;

  /**
   * Updates the preference selected by the user.
   *
   * @param preference Selected theme preference.
   */
  protected selectPreference(preference: ThemePreference): void {
    this.preference.set(preference);
  }
}
