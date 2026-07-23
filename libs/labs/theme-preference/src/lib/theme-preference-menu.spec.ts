import { Component } from '@angular/core';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ThemePreference } from './theme-preference';
import { ThemePreferenceMenu } from './theme-preference-menu';

@Component({
  imports: [ThemePreferenceMenu],
  template: `<ang-theme-preference-menu [(preference)]="preference" />`,
})
class ThemePreferenceMenuHost {
  /** Preference bound to the menu component. */
  preference: ThemePreference = 'system';
}

describe('ThemePreferenceMenu', () => {
  it('renders a Material icon-button menu trigger', async () => {
    await render(ThemePreferenceMenu);

    const trigger = screen.getByRole('button', { name: 'Choose theme preference' });
    expect(trigger).toBeVisible();
    expect(within(trigger).getByRole('img', { hidden: true })).toHaveAttribute('data-mat-icon-name', 'brightness_4');
  });

  it('shows the default Material tooltip on hover', async () => {
    const user = userEvent.setup();
    await render(ThemePreferenceMenu);

    await user.hover(screen.getByRole('button', { name: 'Choose theme preference' }));

    expect(await screen.findAllByText('Theme settings')).toHaveLength(2);
  });

  it('shows the default Material tooltip on keyboard focus', async () => {
    const user = userEvent.setup();
    await render(ThemePreferenceMenu);

    await user.tab();

    expect(screen.getByRole('button', { name: 'Choose theme preference' })).toHaveFocus();
    expect(await screen.findAllByText('Theme settings')).toHaveLength(2);
  });

  it('renders all theme preferences and marks the device setting by default', async () => {
    const user = userEvent.setup();
    await render(ThemePreferenceMenu);

    await user.click(screen.getByRole('button', { name: 'Choose theme preference' }));

    expect(screen.getByRole('menuitemradio', { name: 'Light mode' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('menuitemradio', { name: 'Dark mode' })).toHaveAttribute('aria-checked', 'false');
    const deviceOption = screen.getByRole('menuitemradio', { name: 'Device settings' });
    expect(deviceOption).toHaveAttribute('aria-checked', 'true');
    expect(
      within(deviceOption)
        .getAllByRole('img', { hidden: true })
        .map((icon) => icon.getAttribute('data-mat-icon-name')),
    ).toEqual(['devices', 'check']);
  });

  it('updates the bound preference when the user chooses an option', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(ThemePreferenceMenuHost);

    await user.click(screen.getByRole('button', { name: 'Choose theme preference' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Light mode' }));

    expect(fixture.componentInstance.preference).toBe('light');
  });

  it('reserves check-icon space and shows the check only for the selected option', async () => {
    const user = userEvent.setup();
    await render(ThemePreferenceMenu, { inputs: { preference: 'dark' } });

    await user.click(screen.getByRole('button', { name: 'Choose theme preference' }));

    const lightOption = screen.getByRole('menuitemradio', { name: 'Light mode' });
    const darkOption = screen.getByRole('menuitemradio', { name: 'Dark mode' });
    const deviceOption = screen.getByRole('menuitemradio', { name: 'Device settings' });
    expect(darkOption).toHaveAttribute('aria-checked', 'true');
    expect(within(lightOption).getAllByRole('img', { hidden: true })[1]).not.toBeVisible();
    expect(within(darkOption).getAllByRole('img', { hidden: true })[1]).toBeVisible();
    expect(within(deviceOption).getAllByRole('img', { hidden: true })[1]).not.toBeVisible();
  });

  it('supports a disabled trigger', async () => {
    await render(ThemePreferenceMenu, { inputs: { disabled: true } });

    expect(screen.getByRole('button', { name: 'Choose theme preference' })).toBeDisabled();
  });

  it('supports a custom accessible trigger label', async () => {
    await render(ThemePreferenceMenu, { inputs: { ariaLabel: 'Change application theme' } });

    expect(screen.getByRole('button', { name: 'Change application theme' })).toBeVisible();
  });
});
