import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnalytics, withCustomBackend } from '@atlasng/analytics';
import { provideAngIcons } from '@atlasng/design-system/icons';
import { appRoutes } from './app.routes';
import { NoopAnalyticsBackend } from './noop-analytics-backend';

/** SVG literal registered as the `ang:star` icon. */
const STAR_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m12 2 3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7z"/></svg>';

/** Application configuration shared by the browser and the server. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnalytics(
      { appName: 'atlasng' },
      withCustomBackend(() => new NoopAnalyticsBackend()),
    ),
    provideAngIcons({ literals: { star: STAR_ICON } }),
  ],
};
