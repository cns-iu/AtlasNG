# @atlasng/labs/theme-preference

Experimental theme-preference controls and browser-state management for AtlasNG applications.

## Usage

Configure the service once with the application's light and dark theme classes:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideThemePreference } from '@atlasng/labs/theme-preference';

export const appConfig: ApplicationConfig = {
  providers: [
    provideThemePreference({
      lightThemeClass: 'hra-light-theme',
      darkThemeClass: 'hra-dark-theme',
    }),
  ],
};
```

Bind the presentational selector to the service:

```ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemePreferenceSelector, ThemePreferenceService } from '@atlasng/labs/theme-preference';

@Component({
  selector: 'app-appearance-settings',
  imports: [ThemePreferenceSelector],
  template: ` <ang-theme-preference-selector [preference]="themePreference.preference()" (preferenceChange)="themePreference.setPreference($event)" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSettings {
  protected readonly themePreference = inject(ThemePreferenceService);
}
```

The default preference is `system`. The service follows device color-scheme changes, persists explicit choices,
sets `data-theme` and `color-scheme` on the document root, and applies the configured theme class.
