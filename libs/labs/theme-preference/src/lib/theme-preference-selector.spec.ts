import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ThemePreference } from './theme-preference';
import { ThemePreferenceSelector } from './theme-preference-selector';

@Component({
  imports: [ThemePreferenceSelector],
  template: `<ang-theme-preference-selector [(preference)]="preference" />`,
})
class ThemePreferenceSelectorHost {
  /** Preference bound to the presentational selector. */
  preference: ThemePreference = 'system';
}

describe('ThemePreferenceSelector', () => {
  it('selects the device setting by default', async () => {
    await render(ThemePreferenceSelector);

    expect(screen.getByRole('radio', { name: 'Device settings' })).toBeChecked();
  });

  it('renders an initial preference', async () => {
    await render(ThemePreferenceSelector, { inputs: { preference: 'light' } });

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
  });

  it('emits the preference selected by the user', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(ThemePreferenceSelectorHost);

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(fixture.componentInstance.preference).toBe('dark');
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('disables every preference option', async () => {
    await render(ThemePreferenceSelector, { inputs: { disabled: true } });

    expect(screen.getByRole('radio', { name: 'Light' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Device settings' })).toBeDisabled();
  });

  it('applies a custom accessible group label', async () => {
    await render(ThemePreferenceSelector, { inputs: { ariaLabel: 'Application color scheme' } });

    expect(screen.getByRole('radiogroup', { name: 'Application color scheme' })).toBeVisible();
  });
});
